import http from 'k6/http';

export const options = {
    vus: 15,
    duration: '45s',
    thresholds: {
        http_req_duration: ['p(90)<2000'],
    },
};

export default function(){
    http.get('http://localhost:8000/api/py/sessions/');
}
