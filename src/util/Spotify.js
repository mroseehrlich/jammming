const clientId = 'e97660c8800f4d97ad0c1cfb99f62a1c';
//const redirectUri = 'http://localhost:3000/';
const redirectUri = 'http://jamming-miamaiarosa.surge.sh';
let accessToken;

const Spotify = {
    getAccessToken() {
        if (accessToken) {
            return accessToken;
        }
        
        const newAccessToken = window.location.href.match(/access_token=([^&]*)/);
        const newExpiresIn = window.location.href.match(/expires_in=([^&]*)/);
            
        if (newAccessToken && newExpiresIn) {
            accessToken = newAccessToken[1];
            const expiresIn = Number(newExpiresIn[1]);
            window.setTimeout(() => accessToken = '', expiresIn * 1000);
            window.history.pushState('Access Token', null, '/');
            return accessToken;
        } else {
            const accessUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&scope=playlist-modify-public&show_dialog=true&redirect_uri=${redirectUri}`;
            window.location = accessUrl;
        }
    },

    search(term) {
        const accessToken = Spotify.getAccessToken();
        const headers = {
            Authorization: `Bearer ${accessToken}`
        };
        return fetch(`https://api.spotify.com/v1/search?type=track&q=${term}`, {headers: headers}).then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('Request failed!');
        }, networkError => {
            console.log(networkError.message);
        }).then(jsonResponse => {
            if (!jsonResponse.tracks) {
                return [];
            }

            return jsonResponse.tracks.items.map(track => ({id: track.id, name: track.name, artist: track.artists[0].name, album: track.album.name, uri: track.uri}));
        });
    },

    savePlaylist(playlistName, playlistTrackURIs) {
        if (!playlistName || playlistTrackURIs.length < 1) {
            return;
        }

        const accessToken = Spotify.getAccessToken();
        const headers = {
            Authorization: `Bearer ${accessToken}`
        };
        let userId;

        return fetch('https://api.spotify.com/v1/me', {headers: headers}).then(response => response.json()
        ).then(jsonResponse => {
            userId = jsonResponse.id;

            return fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
                headers: headers,
                method: 'POST',
                body: JSON.stringify({name: playlistName})
            }).then(response => response.json()).then(jsonResponse => {
                const playlistId = jsonResponse.id;   

                return fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
                    headers: headers,
                    method: 'POST',
                    body: JSON.stringify({uris: playlistTrackURIs})
                }).then(response => response.json()).then(jsonResponse => jsonResponse);
            });
        });
    } 
}

export default Spotify;