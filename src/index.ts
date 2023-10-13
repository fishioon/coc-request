import { fetch, commands, ExtensionContext, window, workspace, OutputChannel } from 'coc.nvim';

export async function activate(context: ExtensionContext): Promise<void> {
  window.showMessage(`coc-request works!`);

  context.subscriptions.push(
    commands.registerCommand('coc-request.Command', async () => {
      return request();
    })
  );
}

async function request() {
  const { document, position } = await workspace.getCurrentState();
  const lines = document.getText().split('\n');
  let start = 0;
  let end = lines.length;
  for (let i = position.line; i >= 0; i--) {
    if (lines[i].startsWith('###')) {
      start = i + 1;
      break;
    }
  }
  for (let i = position.line + 1; i < lines.length; i++) {
    if (lines[i].startsWith('###')) {
      end = i;
      break;
    }
  }
  const name = 'coc-request';
  const channel = getChannel(name);
  channel.show();
  const req = parseHttpRequest(lines.slice(start, end));
  const url = 'http://' + req.headers.host + req.path;
  channel.appendLine(url);
  const res = await fetch(url, req);
  channel.appendLine(JSON.stringify(res));
  window.showMessage(JSON.stringify(res));
}

function parseHttpRequest(lines: string[]) {
  let i = 0;
  const req = {
    path: '/',
    headers: {
      host: '',
    },
    method: 'GET',
    body: '',
  };
  while (lines[i].startsWith('#')) i++;
  const arr = lines[i++].split(' ');
  req.method = arr[0];
  req.path = arr[1];

  for (; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*$/.test(line)) {
      break;
    }
    const header = line.split(': ');
    req.headers[header[0].toLowerCase()] = header[1];
  }
  req.body = lines.slice(i).join('\n');
  return req;
}

function getChannel(name: string): OutputChannel {
  return window.createOutputChannel(name);
}
