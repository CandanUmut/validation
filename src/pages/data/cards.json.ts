// The review deck, built from the content at build time.
import { deck } from '../../lib/data';
export async function GET() { return new Response(JSON.stringify(await deck()), { headers: { 'Content-Type': 'application/json' } }); }
