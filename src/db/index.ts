import { MongoClient } from '../../deps.ts';

const dbClient = new MongoClient();

await dbClient.connect(Deno.env.get('MONGO_URI_PRODUCTION') as string);

const db = dbClient.database('kultige_videos');

export { db };
