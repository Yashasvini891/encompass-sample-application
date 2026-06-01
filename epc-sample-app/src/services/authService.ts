export const getAccessToken = async () => {


  const body = new URLSearchParams();

  body.append("grant_type", "client_credentials");
  body.append("client_id", import.meta.env.VITE_APP_CLIENT_ID);
  body.append("client_secret", import.meta.env.VITE_APP_CLIENT_SECRET);
  body.append("scope", import.meta.env.VITE_APP_SCOPE);

  const response = await fetch("https://concept.api.elliemae.com/oauth2/v1/token", {
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
