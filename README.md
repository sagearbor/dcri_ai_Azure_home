# DCRI AI Project Hub

A dynamic project hub that automatically discovers and displays all DCRI AI projects with AI-generated metadata and filtering capabilities.

## Features

- 🤖 **AI-Generated Metadata** - Automatically analyzes repositories to create project descriptions
- 🔍 **Smart Filtering** - Filter projects by technology, category, language, and more
- 🔗 **Live Links** - Automatically links to hosted applications when available, GitHub repos otherwise
- ⚡ **Auto-Updates** - Maintains up-to-date project information via GitHub Actions

## Local Development

To run the project hub locally:

1. **Clone the repository**
   ```bash
   git clone https://github.com/sagearbor/dcri_ai_Azure_home.git
   cd dcri_ai_Azure_home
   ```

2. **Start a local HTTP server** (required for loading JSON data)
   ```bash
   python -m http.server 8000 --bind 127.0.0.1
   ```

3. **Open in browser**
   ```
   http://127.0.0.1:8000
   ```

   > **Note**: You cannot simply open `index.html` directly in a browser due to CORS restrictions when loading `projects.json`. You must use an HTTP server.

## How It Works

### 1. Project Discovery
- Edit `projects.yml` to add/remove repositories
- Each entry requires a `repo` URL and optional `overrides`

### 2. Metadata Generation
- GitHub Actions automatically analyzes each repository
- AI generates metadata including name, description, technologies, category
- Creates `project-meta.json` in each repository

### 3. Hub Updates  
- When `projects.yml` changes, the hub rebuilds `projects.json`
- Fetches metadata from all repositories and applies overrides
- Frontend displays updated project list with filtering

## Adding New Projects

1. **Add to projects.yml:**
   ```yaml
   - repo: https://github.com/sagearbor/my-new-project
     overrides:
       description: "Custom description override"
       icon: "bi-robot"
   ```

2. **Commit and push** - GitHub Actions will automatically:
   - Generate metadata for the new repository
   - Update the project hub
   - Deploy changes

## Adding Hosted URLs

When you deploy a project, add the hosted URL to the repository's `project-meta.json`:

```json
{
  "name": "My Project",
  "hosted_url": "https://my-project.azurewebsites.net",
  "description": "...",
  "technologies": ["..."]
}
```

The hub will automatically use the hosted URL instead of the GitHub link.

## Architecture

- **Frontend**: Vanilla HTML/CSS/JavaScript with Bootstrap
- **Data**: JSON-based project metadata
- **Automation**: GitHub Actions workflows
- **AI**: GitHub Models API for metadata generation

## GitHub Actions Workflows

1. **generate-metadata.yml** - Analyzes repositories and creates metadata
2. **update-projects.yml** - Rebuilds the project hub when projects.yml changes

## Contributing

1. Fork the repository
2. Add your project to `projects.yml`
3. Create a pull request

The system will automatically generate metadata and update the hub when merged.