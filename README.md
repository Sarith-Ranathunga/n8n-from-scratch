# Learn n8n from Scratch

A beginner-friendly n8n course in **10 lessons**, with every workflow I built along the way.
You go from your first workflow to a secure, AI-powered order system.

The course guide also includes two extra learning lessons, **AI agents and MCP** and **Docker**. They are covered in the guide only, not in this repository.

**Full course guide (start here):** [Learn n8n from Scratch](https://claude.ai/artifact/8ULKzwmvsmwBuBr6UY8UMw)

## What's inside

| Folder | Topic | You will learn |
| --- | --- | --- |
| [`lessons/lesson-01-first-workflow`](lessons/lesson-01-first-workflow) | First workflow | Nodes, items, JSON, expressions `{{ }}` |
| [`lessons/lesson-02-http-requests`](lessons/lesson-02-http-requests) | APIs | HTTP Request, nested data, query parameters |
| [`lessons/lesson-03-google-sheets`](lessons/lesson-03-google-sheets) | Credentials | OAuth2, Google Sheets |
| [`lessons/lesson-04-decisions`](lessons/lesson-04-decisions) | Decisions | IF, Switch, Filter, AND vs OR |
| [`lessons/lesson-05-schedules`](lessons/lesson-05-schedules) | Automation | Schedule Trigger, Publish, timezones, cron |
| [`lessons/lesson-06-many-items`](lessons/lesson-06-many-items) | Lists | Upsert, Split Out, Sort, Limit, Summarize, Aggregate, Merge |
| [`lessons/lesson-07-webhooks`](lessons/lesson-07-webhooks) | Webhooks | Your own secure API, Respond to Webhook, Header Auth |
| [`lessons/lesson-08-ai`](lessons/lesson-08-ai) | AI | LLM Chain, Text Classifier, Information Extractor, AI Agent with memory |
| [`lessons/lesson-09-errors`](lessons/lesson-09-errors) | Errors | Retries, error outputs, pinning, an Error Alarm with Claude |
| [`lessons/lesson-10-final-project`](lessons/lesson-10-final-project) | Final project | Smart Order System: Order Intake API + Daily Sales Report |

## How to use a workflow from this repo

1. Install n8n (`npx n8n`, n8n Cloud, or Docker).
2. Download a `.json` file from a lesson folder.
3. In n8n: **Create workflow > ... menu > Import from File**.
4. **Reconnect your own credentials** (Google Sheets, Gemini/Anthropic, Header Auth). Credentials are never shared in this repo; each node only shows the credential's name so you know what to connect.
5. Replace `YOUR_SPREADSHEET_ID` placeholders by picking your own Google Sheet in the node.

## Tools used

- n8n (self-hosted on Windows)
- Google Sheets as a simple database
- AI models: Google Gemini and Anthropic Claude
- Free practice APIs: JSONPlaceholder, DummyJSON, Open-Meteo, httpbin

## Adding your own workflows (for maintainers)

Export your workflows, then let the script clean and sort them:

```bash
npx n8n export:workflow --backup --output=./backup/workflows/
node scripts/organize-workflows.js ./backup/workflows
```

The script removes pinned test data, credential IDs, the instance ID and Google Sheet IDs, keeps each workflow's exact name as its file name (for example `Lesson 8 - Exercise 02.json`), puts it in the matching lesson folder, and warns about any API key typed directly into a node. Always review the files before pushing.

## Security notes

- Never commit `.env`, exported credentials, or n8n's `config` file (it contains the encryption key). `.gitignore` blocks them.
- Webhook secrets and API keys belong in n8n credentials, not in node fields.

## License

Feel free to use these workflows to learn and teach. Add a LICENSE file (for example MIT) if you want to make the terms explicit.
