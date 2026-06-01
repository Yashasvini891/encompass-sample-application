export const getAccessToken = async () => {
  const url = "https://api.em/oauth2/v1/token";

  const body = new URLSearchParams();

  body.append("grant_type", "client_credentials");
  body.append("client_id", "YOUR_CLIENT_ID");
  body.append("client_secret", "YOUR_CLIENT_SECRET");

  // 🔥 IMPORTANT: add scope (you were missing this)
  body.append("scope", "YOUR_SCOPE_VALUE");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(err);
  }

  const data = await response.json();

  return data.access_token;
};
