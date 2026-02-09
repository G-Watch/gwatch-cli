# G-Watch CLI

<div align="center">
    <img src="./docs/logo.jpg" width="500px" />
</div>

G-Watch CLI is a tool for running agentic GPU system profiling and optimization using [G-Watch](https://github.com/G-Watch/G-Watch).

## Features

- **Workspace Management**: Clone remote repos or map local directories.
- **Environment Automation**: Automatically installs Node.js, Tmux, and `@google/gemini-cli` inside the container.
- **Session Management**: Wraps Tmux sessions for persistent development.
- **Easy Access**: Simple commands to create, enter, list, and stop environments.

## Installation

Install globally via npm:

```bash
npm install -g @gwatch/gwatch-cli
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
gwatch-cli create --repo https://github.com/user/project.git --dockerfile ./Dockerfile
```

### 2. Create a container from current local directory
```bash
gwatch-cli create --dir . --dockerfile ./Dockerfile
```

### 3. Enter a container/session
```bash
# Enter container 0, default session
gwatch-cli enter 0

# Enter container 0, specific session (creates if not exists)
gwatch-cli enter 0/debug_sass
```

### 4. List status
```bash
gwatch-cli ls
```

### 5. Stop commands
```bash
# Stops the Docker Container
gwatch-cli stop 0

# Kills only the specific tmux session inside the container
gwatch-cli stop 0/debug_sass
```

## Internal Database
Metadata is stored in `~/.watchtower/db.json`.