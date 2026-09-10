// Cấu hình CORS ép buộc
const allowCors = fn => async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  return await fn(req, res);
};

// Hàm xử lý chính
const handler = async (req, res) => {
  // Chỉ nhận POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const payload = req.body;
    
    // Kiểm tra biến môi trường
    if (!process.env.SECRET_TOKEN || !process.env.GAS_WEBHOOK_URL) {
       return res.status(500).json({ status: "error", msg: "Server thiếu biến môi trường" });
    }

    payload.secret_token = process.env.SECRET_TOKEN;

    const gasResponse = await fetch(process.env.GAS_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await gasResponse.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error("Lỗi:", error);
    return res.status(500).json({ status: "error", msg: error.toString() });
  }
}

// Xuất file kiểu CommonJS (Tránh lỗi Syntax Error của Vercel)
module.exports = allowCors(handler);
