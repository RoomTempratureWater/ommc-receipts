import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';

export async function GET(request: NextRequest) {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return NextResponse.json({ error: 'DATABASE_URL is not set' }, { status: 500 });
    }

    // Return a ReadableStream wrapping the pg_dump output
    const stream = new ReadableStream({
      start(controller) {
        const pgDump = spawn('pg_dump', [
          '--clean',
          '--if-exists',
          '--format=plain',
          '--no-owner',
          '--no-privileges',
          databaseUrl
        ]);

        let isClosed = false;

        pgDump.stdout.on('data', (chunk) => {
          if (!isClosed) controller.enqueue(chunk);
        });

        pgDump.stderr.on('data', (chunk) => {
          console.error(`pg_dump stderr: ${chunk.toString()}`);
        });

        pgDump.on('error', (err) => {
          console.error('Failed to start pg_dump:', err);
          if (!isClosed) {
            isClosed = true;
            controller.error(err);
          }
        });

        pgDump.on('close', (code) => {
          if (code !== 0) {
            console.error(`pg_dump exited with code ${code}`);
          }
          if (!isClosed) {
            isClosed = true;
            controller.close();
          }
        });
      }
    });

    const dateStr = new Date().toISOString().split('T')[0];
    
    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'application/sql',
        'Content-Disposition': `attachment; filename="database_backup_${dateStr}.sql"`,
      },
    });

  } catch (error: any) {
    console.error('Backup API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
