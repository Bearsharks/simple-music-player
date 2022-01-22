import { useNavigate } from "react-router-dom";
import { useEffect } from "react"
import Spinner from "./Spinner";

const getProfileURL = `/hello`;
function InitPage() {
    const navigate = useNavigate();
    useEffect(() => {
        fetch(process.env.REACT_APP_API_URL + getProfileURL, {
            credentials: 'include'
        }).then((res) => {
            return res.text();
        }).then((hello) => {
            if (hello === 'hello') {
                navigate('/login');
            } else {
                window.userInfo = hello;
                navigate('/main');
            }
        }).catch((e) => {
            navigate('/login');
        })
    }, [navigate]);
    return (
        <Spinner></Spinner>
    )
}
export default InitPage;