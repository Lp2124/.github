# .github

*Community health files for the @GitHub organization*

For more information, please see the article on [creating a default community health file for your organization](https://help.github.com/en/articles/creating-a-default-community-health-file-for-your-organization).

## HacxGPT CLI

This repository now includes a terminal chat client in `hacxgpt_cli.py`.
It supports OpenAI-compatible providers, streams Markdown responses, and stores the API key locally in `.hacx`.

### Install

```bash
python -m pip install -r requirements.txt
```

### Run

```bash
python hacxgpt_cli.py
```

By default the app uses OpenRouter. To switch providers, set `HACXGPT_PROVIDER` before launching:

```bash
HACXGPT_PROVIDER=deepseek python hacxgpt_cli.py
```

