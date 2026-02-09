# Watchtower

<div align="center">
    <img src="./docs/logo.jpg" width="500px" />
</div>

Watchtower is a CLI tool that manage agentic persistent development environments.

## Features

- **Workspace Management**: Clone remote repos or map local directories.
- **Environment Automation**: Automatically installs Node.js, Tmux, and `@google/gemini-cli` inside the container.
- **Session Management**: Wraps Tmux sessions for persistent development.
- **Easy Access**: Simple commands to create, enter, list, and stop environments.

## Installation

Install globally via npm:

```bash
npm install -g @gwatch/watchtower
```

Alternatively, to install from source:

```bash
git clone https://github.com/G-Watch/Watchtower.git
cd Watchtower
npm install -g .
```

## Usage

### 1. Create a container from a remote git repo
```bash
watchtower create --repo https://github.com/user/project.git --dockerfile ./Dockerfile
```

### 2. Create a container from current local directory
```bash
watchtower create --dir . --dockerfile ./Dockerfile
```

### 3. Enter a container/session
```bash
# Enter container 0, default session
watchtower enter 0

# Enter container 0, specific session (creates if not exists)
watchtower enter 0/debug_sass
```

### 4. List status
```bash
watchtower ls
```

### 5. Stop commands
```bash
# Stops the Docker Container
watchtower stop 0

# Kills only the specific tmux session inside the container
watchtower stop 0/debug_sass
```

## Internal Database
Metadata is stored in `~/.watchtower/db.json`.
