import { useNavigate } from "react-router-dom";
import { useEffect } from "react"
import Spinner from "./components/Spinner";

function InitPage() {
    const navigate = useNavigate();
    useEffect(() => {
        fetch(process.env.REACT_APP_API_URL + `/token`, {
            credentials: 'include'
        }).then((res) => {
            if (res.status !== 200) throw "not 200";
            return res.text();
        }).then((token) => {
            sessionStorage.setItem("access_token", token);
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