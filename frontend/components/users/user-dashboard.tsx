"use client";

import { useEffect, useState } from "react";
import { User as UserIcon, Briefcase, Mail, Phone, Shield, RefreshCw } from "lucide-react";

import { usersApi } from "@/lib/api";
import { type User } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShipperStatistic } from "../statistics/shipper-statistic";
import { SellerStatistic } from "../statistics/seller-statistic";

export function UserDashboard() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSession() {
      try {
        setLoading(true);
        const data = await usersApi.getProfile();
        console.log(data)
        setCurrentUser(data.user);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to authenticate session");
      } finally {
        setLoading(false);
      }
    }
    void fetchSession();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !currentUser) {
    return (
      <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive font-medium m-6">
        {error || "Unauthorized access. Please log in again."}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Profile Info Header banner */}
      <Card className="bg-gradient-to-r from-slate-50 via-white to-slate-50 border-slate-200">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary shadow-inner border border-primary/20">
                {currentUser.username?.[0]?.toUpperCase() || "E"}
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight">
                  Welcome back, {currentUser.fullName || currentUser.username}!
                </h2>
                <p className="text-sm text-muted-foreground">
                  Here is your performance snapshot and commercial analytics for today.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <Badge variant="outline" className="flex items-center gap-1 bg-white px-2.5 py-1 text-xs">
                <Briefcase className="h-3 w-3 text-slate-500" />
                {currentUser.department || "No Department"}
              </Badge>
              <Badge className="flex items-center gap-1 px-2.5 py-1 text-xs capitalize">
                <Shield className="h-3 w-3" />
                Role: {currentUser.role}
              </Badge>
            </div>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6 pt-4 border-t border-dashed text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-slate-400" />
              <span className="truncate">{currentUser.email || "No email assigned"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-slate-400" />
              <span>{currentUser.phoneNumber || "No phone linked"}</span>
            </div>
            <div className="flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-slate-400" />
              <span>Username: <strong className="text-foreground">@{currentUser.username}</strong></span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Embedded Statistic Section Core */}
      <div className="bg-card rounded-xl border p-6 shadow-sm">
        {currentUser.role?.toLowerCase() === "shipper" ? (
          <ShipperStatistic 
            userId={currentUser.id}
            userName={currentUser.fullName || currentUser.username} 
          />
        ) : (
          <SellerStatistic 
            userId={currentUser.id}
            userName={currentUser.fullName || currentUser.username} 
          />
        )}
      </div>

    </div>
  );
}