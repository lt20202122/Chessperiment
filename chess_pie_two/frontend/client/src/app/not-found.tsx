import Link from "next/link"

export default function NotFound() {
    return <div className="m-5">
        <h1 className="text-4xl">Sorry!</h1><br />
        <p>We could not find the page you were looking for.</p> <br />
        <Link href="/">Back to Homepage</Link>
    </div>
}