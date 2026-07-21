// ai/GeminiToolsService.ts
import { GoogleGenerativeAI, Part, Content } from '@google/generative-ai';
import { toolRegistry } from './toolsRegistry';
import { toolSchemas } from './toolsSchema';
import { ToolContext } from '@src/models/common/types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function toGeminiHistory(history: ChatMessage[]): Content[] {
  return history.map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user', 
    parts: [{ text: msg.content }],
  }));
}

async function chat(userMessage: string, history: ChatMessage[], ctx: ToolContext) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-3.5-flash',
    tools: [{ functionDeclarations: toolSchemas }],
    systemInstruction: `Bạn là trợ lý nội bộ, giúp nhân viên tra cứu dữ liệu công ty.
      Luôn trả lời bằng định dạng Markdown để dễ đọc:
      - Dùng danh sách gạch đầu dòng (-) hoặc số thứ tự (1., 2.) khi liệt kê nhiều mục.
      - Dùng bảng Markdown khi trả về dữ liệu dạng bảng (nhiều dòng, nhiều cột như danh sách nhân viên, đơn hàng...).
      - In đậm (**...**) các con số hoặc từ khóa quan trọng (doanh số, tên khách hàng, trạng thái...).
      - Không lạm dụng heading (#) trong câu trả lời ngắn, chỉ dùng khi nội dung thực sự có nhiều phần.`,
      });
  const chatSession = model.startChat({
    history: toGeminiHistory(history), 
  });

  let result = await chatSession.sendMessage(userMessage);

  while (true) {
    const functionCalls = result.response.functionCalls();
    if (!functionCalls || functionCalls.length === 0) break;

    const functionResponses: Part[] = [];

    for (const call of functionCalls) {
      const fn = toolRegistry[call.name];
      let responsePayload: object;

      try {
        if (!fn) throw new Error(`Không tìm thấy tool ${call.name}`);
        const raw = await fn(call.args, ctx);

        if (Array.isArray(raw)) {
          responsePayload = { items: raw };
        } else if (typeof raw === 'object' && raw !== null) {
          responsePayload = raw;
        } else {
          responsePayload = { result: raw };
        }
      } catch (err: any) {
        responsePayload = { error: err.message ?? 'Lỗi không xác định' };
      }

      functionResponses.push({
        functionResponse: { name: call.name, response: responsePayload },
      });
    }

    result = await chatSession.sendMessage(functionResponses);
  }

  return result.response.text();
}

export default { chat };