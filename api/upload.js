export default async function handler(req, res) {
    console.log("STEP 1: API reached");

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    console.log("STEP 2: POST confirmed");

    try {
        const { content, author } = req.body || {};

        console.log("STEP 3: Body received");
        console.log("Content exists:", !!content);
        console.log("Author exists:", !!author);

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

        console.log("STEP 4: Checking GitHub token");

        const token = process.env.GITHUB_TOKEN;

        if (!token) {
            console.log("STEP 4 FAILED: GITHUB_TOKEN is missing");

            return res.status(500).json({
                error: "GITHUB_TOKEN is not available in this deployment"
            });
        }

        console.log("STEP 5: Token exists");

        const submissionId =
            Date.now().toString(36) +
            "-" +
            Math.random().toString(36).substring(2, 8);

        const submission = {
            id: submissionId,
            author,
            content,
            submittedAt: new Date().toISOString()
        };

        const filePath =
            `bedrock-commands/pending/${submissionId}.json`;

        console.log("STEP 6: About to contact GitHub");

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

        console.log("STEP 7: GitHub responded:", response.status);

        if (!response.ok) {
            const githubError = await response.text();

            console.error("STEP 7 FAILED:", githubError);

            return res.status(500).json({
                error: "GitHub rejected the request",
                details: githubError
            });
        }

        console.log("STEP 8: Submission saved");

        return res.status(200).json({
            message: "Submission received successfully!",
            id: submissionId
        });

    } catch (error) {
        console.error("UNEXPECTED ERROR:", error);

        return res.status(500).json({
            error: "Unexpected backend error",
            details: error.message
        });
    }
}
