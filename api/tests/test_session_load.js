import http from 'k6/http';
const default_user_id = "83b9e7ff-636a-4b0e-bc93-85db61c30dea";
export const options = {
    vus: 15,
    duration: '45s',
    thresholds: {
        http_req_duration: ['p(90)<2000'],
    },
};

export default function(){
    http.get(`http://localhost:8000/api/py/sessions/?user_id=${default_user_id}`);
}