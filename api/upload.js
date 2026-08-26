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

        const token = process.env.GITHUB_TOKEN;

        if (!token) {
            return res.status(500).json({
                error: "GitHub token is not configured"
            });
        }

        const submissionId =
            Date.now().toString(36) +
            "-" +
            Math.random().toString(36).substring(2, 8);

        const submission = {
            id: submissionId,
            author: author,
            content: content,
            submittedAt: new Date().toISOString()
        };

        const filePath =
            `bedrock-commands/pending/${submissionId}.json`;

        const response = await fetch(
            `https://api.github.com/repos/nako-hikari/minecraft-bedrock/contents/${filePath}`,
            {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message: `New command submission: ${submissionId}`,
                    content: Buffer.from(
                        JSON.stringify(submission, null, 2)
                    ).toString("base64")
                })
            }
        );
if (!response.ok) {
    const githubError = await response.text();

    console.error("GitHub API error:", githubError);

    return res.status(500).json({
        error: "GitHub API error",
        details: githubError
    });
}

        return res.status(200).json({
            message: "Submission received successfully!",
            id: submissionId
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "Internal server error"
        });
    }
}
