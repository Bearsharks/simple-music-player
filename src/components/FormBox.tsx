
interface FormBoxProps {
    items: { name: string, id: string };
    submit: (data: any) => void;
}

function FormBox(prop: FormBoxProps) {
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
            <button onClick={(e) => { e.preventDefault() }}>취소</button>
            <input type="submit" value="새로운재생목록생성" />
        </form>
    )
}

export default FormBox;