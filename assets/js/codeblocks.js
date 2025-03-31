document.addEventListener("DOMContentLoaded", function () {
    const codeBlocks = document.querySelectorAll("pre > code");

    // Language to icon mapping
    const languageIcons = {
        "plaintext": "nerd-font nf-md-note_text",
        "html": "nerd-font nf-dev-html5",
        "css": "nerd-font nf-dev-css3",
        "sass": "nerd-font nf-md-sass",
        "javascript": "nerd-font nf-dev-javascript",
        "js": "nerd-font nf-dev-javascript",
        "java": "nerd-font nf-dev-java",
        "python": "nerd-font nf-dev-python",
        "py": "nerd-font nf-dev-python",
        "bash": "nerd-font nf-dev-bash",
        "sh": "nerd-font nf-dev-bash",
        "rust": "nerd-font nf-seti-rust",
        "c": "nerd-font nf-dev-c",
        "cpp": "nerd-font nf-custom-cpp",
        "c++": "nerd-font nf-custom-cpp",
        "csharp": "nerd-font nf-dev-csharp",
        "ruby": "nerd-font nf-dev-ruby",
        "go": "nerd-font nf-dev-goland",
        "haxe": "nerd-font nf-dev-haxe",
        "lua": "nerd-font nf-dev-lua",
        "typescript": "nerd-font nf-dev-typescript",
        "react": "nerd-font nf-dev-react",
        "jsx": "nerd-font nf-dev-react",
    };

    codeBlocks.forEach((codeBlock) => {
        try {
            // Look for language class in code block's parents
            let language = "plaintext";
            let element = codeBlock;

            // Traverse up the DOM tree to find a language class
            while (element.parentElement) {
                const languageClass = Array.from(element.parentElement.classList).find((cls) =>
                    cls.match(/language-\w+/)
                );
                if (languageClass) {
                    language = languageClass.replace("language-", "");
                    break;
                }
                element = element.parentElement;
            }

            const container = document.createElement("div");
            container.classList.add("code-block");

            const header = document.createElement("div");
            header.classList.add("code-header");

            const languageSpan = document.createElement("span");
            languageSpan.classList.add("code-language");
            languageSpan.textContent = language.toLowerCase();

            const icon = document.createElement("i");
            const iconClass = languageIcons[language] || "nerd-font nf-fa-code";
            icon.classList.add(...iconClass.split(" "));

            header.appendChild(icon);
            header.appendChild(languageSpan);

            const pre = codeBlock.parentElement;
            pre.parentNode.insertBefore(container, pre);
            container.appendChild(header);
            container.appendChild(pre);
        } catch (error) {
            console.error("codeblock error:", error);
        }
    });
});