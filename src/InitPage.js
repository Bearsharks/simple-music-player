import { useNavigate } from "react-router-dom";
import { useEffect } from "react"
import Spinner from "./Spinner";
import axios from "axios";
const getProfileURL = `/main/profile`;
function InitPage() {
    const navigate = useNavigate();
    useEffect(() => {
        axios(process.env.REACT_APP_API_URL + getProfileURL, {
            withCredentials: true
        }).then((res) => {
            if (res.status === 403) throw new Error('403 is unacceptable for me!');
            return res.json();
        }).then((userInfo) => {
            window.userInfo = userInfo;
            navigate('/main');
        }).catch((e) => {
            navigate('/login');
        })
    }, [navigate]);
    return (
        <Spinner></Spinner>
    )
}
export default InitPage;