import { useNavigate } from "react-router-dom";
import { useEffect } from "react"
import Spinner from "./Spinner";

const getProfileURL = `/main/profile`;
function InitPage() {
    const navigate = useNavigate();
    useEffect(() => {
        fetch(process.env.REACT_APP_API_URL + getProfileURL, {
            credentials: 'include'
        }).then((res) => {
            if (res.status === 403) throw new Error('403 is unacceptable for me!');
            return res.text();
        }).then((hi) => {
            window.userInfo = hi;
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