import PageClient from './PageClient';

export default function LogicEditorPage({ params }: { params: { id: string } }) {
    return <PageClient id={params.id} />;
}
