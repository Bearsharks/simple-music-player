import { useNavigate, useParams } from "react-router";
import { memo, useEffect } from "react";
function OauthCallback() {
    const param = useParams();
    window.access_token = param.token;
    const navigate = useNavigate();
    useEffect(() => {
        navigate("/");
    }, [navigate]);
    navigate("/");
    return (
        <div>{param.token}</div>
    );
}
export default memo(OauthCallback);