"use client";

import { useEffect, useState, useRef } from "react";
import { User as UserIcon, Briefcase, Mail, Phone, Shield, RefreshCw, MapPin, Store, Tags, CheckCircle2 } from "lucide-react";

// Import usersApi và locationsApi từ cấu hình API của bạn
import { usersApi, locationsApi } from "@/lib/api"; 
import { type User, type Location } from "@/lib/types"; 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ShipperStatistic } from "../statistics/shipper-statistic";
import { SellerStatistic } from "../statistics/seller-statistic";
import { AssignmentMap } from "../statistics/assignment-map-statistic";

interface OsmStore {
  id: number;
  type: string;
  lat: number;
  lng: number;
  name: string;
  locationId: number | null; // ID địa bàn đối chiếu được từ DB
  rawTags: Record<string, string>;
}

// 🌟 HƯỚNG 1: Hàm so khớp chuỗi tên Phường/Xã để tìm Location ID từ DB công cụ quản lý
function findLocationIdByWardName(rawTags: Record<string, string>, locations: Location[]): number | null {
  if (!locations || locations.length === 0) return null;

  // 1. Lấy tất cả các khóa có khả năng lưu tên phường/xã do OpenStreetMap trả về
  const osmWardName = rawTags["addr:subdistrict"] || 
                      rawTags["addr:ward"] || 
                      rawTags["subdistrict"] || 
                      rawTags["ward"] || 
                      "";
                      
  if (!osmWardName) return null;

  // 2. Hàm làm sạch chuỗi: Chuyển chữ thường, cắt khoảng trắng và loại bỏ tiền tố Phường/Xã/Thị trấn để tăng độ chính xác khi so khớp
  const cleanString = (str: string) => {
    return str
      .toLowerCase()
      .replace(/^(phường|xã|thị trấn)\s+/g, "")
      .trim();
  };

  const targetClean = cleanString(osmWardName);

  // 3. Quét trong danh sách địa bàn hệ thống xem cái nào trùng tên dữ liệu
  const matchedLocation = locations.find((loc) => {
    return cleanString(loc.ward) === targetClean;
  });

  return matchedLocation ? matchedLocation.id : null;
}

export function UserDashboard() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [locations, setLocations] = useState<Location[]>([]); 
  const [selectedLocationId, setSelectedLocationId] = useState<string>(""); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Các biến trạng thái Map & Thực địa ---
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const storeMarkersRef = useRef<any[]>([]); 
  
  const [mapStatus, setMapStatus] = useState<string>("Chưa kích hoạt định vị khu vực");
  const [nearbyStores, setNearbyStores] = useState<OsmStore[]>([]);
  const [allTagKeys, setAllTagKeys] = useState<string[]>([]); 
  const [isScanningStores, setIsScanningStores] = useState<boolean>(false);

  // Đồng bộ nạp thông tin User Profile và Toàn bộ danh sách địa bàn Cần Thơ từ DB lên
  useEffect(() => {
    async function initDashboard() {
      try {
        setLoading(true);
        const [profileData, locationsData] = await Promise.all([
          usersApi.getProfile(),
          locationsApi.getAll() 
        ]);
        
        setCurrentUser(profileData.user);
        setLocations(locationsData);
        
        // Mặc định chọn địa bàn đầu tiên trong danh sách hiển thị
        if (locationsData && locationsData.length > 0) {
          setSelectedLocationId(String(locationsData[0].id));
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }
    void initDashboard();
  }, []);

  // Hàm kích hoạt quét đại lý dựa vào việc định vị GPS hiện tại của thiết bị người dùng
  const handleScanByCurrentLocation = () => {
    if (typeof window === "undefined") return;

    if (!navigator.geolocation) {
      setMapStatus("Trình duyệt không hỗ trợ Geolocation GPS.");
      return;
    }

    setMapStatus("Đang kết nối GPS...");
    setIsScanningStores(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        await runOverpassScanner(lat, lng);
      },
      (err) => {
        console.error(err);
        setMapStatus("Không nhận được tín hiệu định vị GPS từ thiết bị.");
        setIsScanningStores(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const runOverpassScanner = async (centerLat: number, centerLng: number) => {
    setMapStatus(`Đang trích xuất toàn bộ thuộc tính quanh tọa độ của bạn...`);

    try {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      if (!mapContainerRef.current) return;

      // Xóa các marker cũ trên bản đồ
      storeMarkersRef.current.forEach(m => m.remove());
      storeMarkersRef.current = [];

      let map = mapInstanceRef.current;
      if (!map) {
        map = L.map(mapContainerRef.current).setView([centerLat, centerLng], 16);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
        }).addTo(map);
        mapInstanceRef.current = map;
      } else {
        map.setView([centerLat, centerLng], 16);
      }

      if (markerRef.current) {
        markerRef.current.setLatLng([centerLat, centerLng]);
      } else {
        markerRef.current = L.marker([centerLat, centerLng]).addTo(map);
      }
      markerRef.current.bindPopup("<b>📍 Vị trí hiện tại của bạn</b>").openPopup();

      const radius = 1500; 
      const overpassQuery = `
        [out:json][timeout:25];
        (
          node["shop"](around:${radius},${centerLat},${centerLng});
          node["amenity"="restaurant"](around:${radius},${centerLat},${centerLng});
          node["amenity"="cafe"](around:${radius},${centerLat},${centerLng});
          node["amenity"="fuel"](around:${radius},${centerLat},${centerLng});
        );
        out body;
      `;
      
      const overpassUrl = `https://overpass.openstreetmap.fr/api/interpreter?data=${encodeURIComponent(overpassQuery)}`; 
      const overpassRes = await fetch(overpassUrl);
      
      if (overpassRes.ok) {
        const overpassData = await overpassRes.json();
        const elements = overpassData.elements || [];

        const keySet = new Set<string>();
        const storesFound: OsmStore[] = [];

        elements.forEach((el: any) => {
          const tags = el.tags || {};
          
          // Trích xuất các key động để làm bảng thống kê thuộc tính
          Object.keys(tags).forEach(key => {
            let cleanKey = key;
            if (key.startsWith("addr:")) {
              cleanKey = key.replace("addr:", "");
            }
            if (cleanKey !== "amenity" && cleanKey !== "shop" && cleanKey !== "name") {
              keySet.add(cleanKey);
            }
          });

          const name = tags.name || tags.brand || `Cửa hàng chưa đặt tên (#${el.id})`;
          const type = tags.shop || tags.amenity || "Đại lý";

          // 👉 Áp dụng Hướng 1: Tự động map ID địa bàn dựa trên text tên Phường/Xã từ OSM dữ liệu thực địa
          const mappedLocationId = findLocationIdByWardName(tags, locations);

          storesFound.push({
            id: el.id,
            type: type.toUpperCase(),
            lat: el.lat,
            lng: el.lon, 
            name: name,
            locationId: mappedLocationId, // Đã có ID tương ứng từ Database
            rawTags: tags 
          });

          const storeIcon = L.icon({
            iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
            shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          });

          const sMarker = L.marker([el.lat, el.lon], { icon: storeIcon })
            .addTo(map)
            .bindPopup(`<b>${name}</b><br/><span style="font-size:11px;color:#ef4444;font-weight:bold;">${type.toUpperCase()}</span>`);
          storeMarkersRef.current.push(sMarker);
        });

        setAllTagKeys(Array.from(keySet).sort());
        setNearbyStores(storesFound);
        setMapStatus(`Quét thành công! Đã xử lý bóc tách ${elements.length} địa điểm kinh doanh.`);
      } else {
        setMapStatus("Không thể phản hồi kết nối từ máy chủ OpenStreetMap.");
      }
    } catch (apiErr) {
      console.error(apiErr);
      setMapStatus("Lỗi cấu trúc xử lý phân tích dữ liệu thực địa bản đồ.");
    } finally {
      setIsScanningStores(false);
    }
  };

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !currentUser) {
    return (
      <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive font-medium max-w-md mx-auto mt-10 border border-destructive/20 text-center">
        {error || "Phiên làm việc hết hạn. Vui lòng đăng nhập lại."}
      </div>
    );
  }

  const userRole = currentUser.role?.toLowerCase();

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 mb-12">
      {/* PROFILE BANNER & STATISTICS */}
      <Card className="bg-gradient-to-r from-slate-50 via-white to-slate-50 border-slate-200/80 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-indigo-50 flex items-center justify-center text-xl sm:text-2xl font-bold text-indigo-600 border border-indigo-100">
                {currentUser.username?.[0]?.toUpperCase() || "E"}
              </div>
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  Chào mừng trở lại, {currentUser.fullName || currentUser.username}!
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">Phân hệ đồng bộ hóa và quản lý thực địa tuyến đường.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge variant="outline" className="bg-white">Quyền: {currentUser.role}</Badge>
              <AssignmentMap />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-slate-200 overflow-hidden">
        <CardContent className="p-4 sm:p-6">
          {userRole === "shipper" ? (
            <ShipperStatistic userId={currentUser.id} userName={currentUser.fullName || currentUser.username} />
          ) : (
            <SellerStatistic userId={currentUser.id} userName={currentUser.fullName || currentUser.username} />
          )}
        </CardContent>
      </Card>

      {/* DYNAMIC FIELD INSPECTOR */}
      <Card className="border-indigo-100 shadow-sm overflow-hidden bg-white">
        <CardHeader className="bg-indigo-50/40 border-b border-indigo-50 py-4 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-indigo-950">
            <Tags className="h-5 w-5 text-indigo-600" />
            Bảng Quét Động Toàn Bộ Thuộc Tính Đại Lý (Dynamic Field Inspector)
          </CardTitle>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            {/* Thanh chọn nhanh Bộ lọc hiển thị địa bàn để xem dữ liệu đối soát */}
            <div className="grid gap-1.5 w-full sm:w-56">
              <Label className="text-xs font-semibold text-slate-600">Bộ lọc danh sách địa bàn hệ thống</Label>
              <Select
                value={selectedLocationId}
                onValueChange={(v) => setSelectedLocationId(v)}
              >
                <SelectTrigger className="bg-white border-slate-200 h-9">
                  <SelectValue placeholder="Xem danh sách địa bàn" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={String(loc.id)}>
                      {loc.ward}, {loc.province}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={handleScanByCurrentLocation} 
              disabled={isScanningStores} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm font-medium gap-1.5 h-9 self-end w-full sm:w-auto"
            >
              {isScanningStores ? (
                <><RefreshCw className="h-4 w-4 animate-spin" /> Đang bóc tách trường...</>
              ) : (
                "📍 Khởi động quét quanh đây"
              )}
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-4 sm:p-6 space-y-6">
          <p className="text-xs font-medium text-slate-600 border-l-2 border-indigo-500 pl-2">
            Trạng thái định vị: <span className="text-indigo-600 font-semibold">{mapStatus}</span>
          </p>

          <div ref={mapContainerRef} className="w-full h-[220px] rounded-lg border border-slate-200 bg-slate-50 relative z-0 shadow-sm" />

          {/* DANH SÁCH KEY ĐÃ ĐƯỢC LÀM SẠCH CHỮ ADDR: */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Các loại dữ liệu thu thập được từ thực địa (Đã ẩn tiền tố `addr:`):
            </h4>
            {allTagKeys.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                {allTagKeys.map((keyName) => (
                  <Badge key={keyName} variant="secondary" className="font-mono text-[11px] px-2.5 py-0.5 bg-white border border-slate-200 text-slate-700 shadow-sm capitalize">
                    {keyName}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Nhấn nút kích hoạt quét phía trên để nạp dữ liệu phân tích thực địa.</p>
            )}
          </div>

          {/* HIỂN THỊ CHI TIẾT TỪNG ĐẠI LÝ & KẾT QUẢ ĐỐI CHIẾU DỮ LIỆU ĐỊA BÀN */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Store className="h-4 w-4 text-indigo-600" />
              Chi tiết dữ liệu động của từng địa điểm:
            </h4>
            
            {nearbyStores.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[450px] overflow-y-auto p-1">
                {nearbyStores.map((store) => (
                  <div key={store.id} className="p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all flex flex-col justify-between space-y-3">
                    
                    {/* Header thông tin cơ bản */}
                    <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
                      <div>
                        <h5 className="font-bold text-slate-900 text-sm leading-snug">{store.name}</h5>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Tọa độ: {store.lat.toFixed(5)}, {store.lng.toFixed(5)}
                          {/* Đánh dấu hiển thị nếu so khớp chuỗi thành công */}
                          {store.locationId ? (
                            <span className="text-emerald-600 font-bold ml-1"> ( Khớp Địa Bàn ID: #{store.locationId})</span>
                          ) : (
                            <span className="text-amber-600 font-medium ml-1"> ( Chưa khớp danh sách xã/phường)</span>
                          )}
                        </div>
                      </div>
                      <Badge className="text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md uppercase tracking-wider font-semibold shrink-0">
                        {store.type}
                      </Badge>
                    </div>

                    {/* VÒNG LẶP DUYỆT ĐỘNG */}
                    <div className="space-y-1.5 text-xs">
                      {Object.entries(store.rawTags).map(([k, v]) => {
                        if (k === "name" || k === "amenity" || k === "shop") return null;
                        const cleanLabel = k.startsWith("addr:") ? k.replace("addr:", "") : k;

                        return (
                          <div key={k} className="flex flex-col sm:flex-row sm:items-start bg-slate-50 p-2 rounded-lg border border-slate-100 gap-1 sm:gap-4">
                            <span className="text-[11px] font-bold font-mono text-indigo-600 uppercase shrink-0 sm:w-28 truncate" title={cleanLabel}>
                              {cleanLabel}:
                            </span>
                            <span className="text-slate-700 font-medium break-words flex-1">
                              {v}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Footer kèm nút hành động liên kết trực tiếp ID */}
                    <div className="pt-2 flex items-center justify-between gap-4 border-t border-dashed border-slate-100">
                      <span className="text-[10px] text-slate-400 font-mono">OSM Node: #{store.id}</span>
                      <Button 
                        size="sm" 
                        disabled={!store.locationId} // Khóa nút nếu ko tìm được Địa bàn để liên kết CRM
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3 gap-1 shadow-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => alert(`Đồng bộ CRM thành công! Đại lý đã được gán vào Địa bàn ID: #${store.locationId}`)}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Đồng bộ CRM
                      </Button>
                    </div>

                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground bg-slate-50 p-8 text-center rounded-lg border border-dashed">
                Chưa có dữ liệu thực địa quanh đây. Nhấp nút quét phía trên hệ thống sẽ tự động đối soát trường dữ liệu với DB Cần Thơ của bạn.
              </div>
            )}
          </div>
          
        </CardContent>
      </Card>
    </div>
  );
}