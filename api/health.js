export default function handler(request, response) {
  response.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Mahart Linked Notes API is running',
  });
}
