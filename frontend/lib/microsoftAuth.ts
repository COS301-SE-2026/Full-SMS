export const OneDriveLogin = () => {
    console.log("click");
    
    const clientID = process.env.NEXT_PUBLIC_MS_CLIENT_ID
    const scope = encodeURIComponent('Files.Read offline_access')
    const redirectURI = encodeURIComponent(`http://localhost:3000/auth/onedrive/callback`)
    const authURL = `https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize?client_id=${clientID}&response_type=code&redirect_uri=${redirectURI}&scope=${scope}&response_mode=query`;

    window.open(authURL, "Sign in to OneDrive", 'width=400,height=400 top=200,left=600');
}
