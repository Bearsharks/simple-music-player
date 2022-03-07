import { useNavigate, useParams } from "react-router";
import { memo, useEffect } from "react";
function OauthCallback() {
    const param = useParams();
    sessionStorage.setItem("access_token", param.token);
    const navigate = useNavigate();
    useEffect(() => {
        navigate("/");
    }, [navigate]);
    return (
        <div></div>
    );
}
export default memo(OauthCallback);