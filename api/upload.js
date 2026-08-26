export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {
        const { content, author } = req.body;

        if (!content) {
            return res.status(400).json({
                error: "No content was provided"
            });
        }

        if (!author) {
            return res.status(400).json({
                error: "No author was provided"
            });
        }

        console.log("New submission received:");
        console.log("Author:", author);
        console.log("Content:", content);

        return res.status(200).json({
            message: "Submission received successfully!"
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "Internal server error"
        });
    }
}
