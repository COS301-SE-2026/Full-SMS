export const OneDriveLogin = () => {
  const clientID = process.env.NEXT_PUBLIC_MS_CLIENT_ID;
  const scope = encodeURIComponent("Files.Read offline_access");
  const redirectURI = encodeURIComponent(`${window.location.origin}/auth/onedrive/callback`);
  
  const authURL = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientID}&response_type=code&redirect_uri=${redirectURI}&scope=${scope}&response_mode=query`;

  const width = 600;
  const height = 700;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;

  window.open(
    authURL,
    "Sign in to OneDrive",
    `width=${width},height=${height},top=${top},left=${left},status=no,resizable=yes,scrollbars=yes`
  );
};