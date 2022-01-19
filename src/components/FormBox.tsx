import { isPropertySignature } from "typescript";

function FormBox(prop: any) {
    const createPlaylist = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        e.stopPropagation();
        const form: any = e.target;
        prop.submit(form);

    }
    return (
        <form onSubmit={createPlaylist}>
            <label>이름</label>
            <input id='name' type={'text'}></input>
            <label>설명</label>
            <input id='description' type={'text'}></input>
            <input type="submit" value="새로운재생목록생성" />
        </form>
    )
}

export default FormBox;