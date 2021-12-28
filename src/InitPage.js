import { useNavigate } from "react-router-dom";
import { useEffect } from "react"
import Spinner from "./Spinner";
const getProfileURL = `/simple-music-player-319201/asia-northeast3/main/profile`;
function InitPage() {
    const navigate = useNavigate();

    useEffect(() => {
        fetch(process.env.REACT_APP_API_URL + getProfileURL, {
            credentials: 'include'
        }).then((res) => {
            if (res.status === 403) throw new Error('403 is unacceptable for me!');
            window.userInfo = res.json();
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