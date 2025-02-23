
// src/app/api/socket/route.js
import { socketHandler } from '@/lib/socket';

export async function GET(req) {
  return socketHandler(req);
}

export async function POST(req) {
  return socketHandler(req);
}