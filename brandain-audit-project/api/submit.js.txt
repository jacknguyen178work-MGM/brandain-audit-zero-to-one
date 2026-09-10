// Hàm Wrapper bọc bên ngoài để ÉP Vercel luôn luôn xử lý CORS thành công
const allowCors = fn => async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  
  // Nếu là gói tin thăm dò (OPTIONS) của trình duyệt, trả về 200 OK ngay lập tức
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Nếu là POST bình thường, cho phép chạy tiếp vào logic bên dưới
  return await fn(req, res);
};

// Logic xử lý chính của bạn
async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const payload = req.body;
    
    // Kiểm tra an toàn: Đề phòng bạn lưu thiếu Key trên Vercel
    if (!process.env.SECRET_TOKEN || !process.env.GAS_WEBHOOK_URL) {
       return res.status(500).json({ status: "error", msg: "Thiếu biến môi trường trên Vercel" });
    }

    // Nhét chìa khóa vào data
    payload.secret_token = process.env.SECRET_TOKEN;

    // Gọi sang GAS
    const gasResponse = await fetch(process.env.GAS_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await gasResponse.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error("Vercel API Error:", error);
    return res.status(500).json({ status: "error", msg: error.toString() });
  }
}

// Chốt chặn cuối: Bọc hàm handler bằng allowCors trước khi xuất bản
export default allowCors(handler);
