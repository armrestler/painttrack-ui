function buildHeaders(token) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

function toBase64Unicode(value) {
  return btoa(unescape(encodeURIComponent(value)));
}

function fromBase64Unicode(value) {
  return decodeURIComponent(escape(atob(value)));
}

function buildContentsUrl({ owner, repo, path, branch }) {
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  const url = new URL(`https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}`);
  if (branch) {
    url.searchParams.set('ref', branch);
  }
  return url.toString();
}

export async function getRemoteFile(settings) {
  const response = await fetch(buildContentsUrl(settings), {
    method: 'GET',
    headers: buildHeaders(settings.token)
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`GitHub GET failed: ${response.status}`);
  }

  const payload = await response.json();

  return {
    sha: payload.sha,
    content: JSON.parse(fromBase64Unicode(payload.content.replace(/\n/g, '')))
  };
}

export async function putRemoteFile(settings, content, currentSha = null) {
  const body = {
    message: `PaintTrack sync ${new Date().toISOString()}`,
    content: toBase64Unicode(JSON.stringify(content, null, 2)),
    branch: settings.branch || 'main'
  };

  if (currentSha) {
    body.sha = currentSha;
  }

  const response = await fetch(buildContentsUrl(settings), {
    method: 'PUT',
    headers: {
      ...buildHeaders(settings.token),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GitHub PUT failed: ${response.status} ${errorText}`);
  }

  const payload = await response.json();

  return {
    sha: payload.content?.sha ?? null
  };
}
