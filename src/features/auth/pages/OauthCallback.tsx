import { useNavigate, useParams } from "react-router";
import { memo, useEffect } from "react";
function OauthCallback() {
    const param = useParams();

    const navigate = useNavigate();
    useEffect(() => {
        if (param.token) sessionStorage.setItem("access_token", param.token);
        navigate("/", { replace: true });
    }, [navigate, param.token]);
    return (
        <div></div>
    );
}
export default memo(OauthCallback);
