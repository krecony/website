pkgs: treefmt-nix:
treefmt-nix.lib.evalModule pkgs {
  projectRootFile = "flake.nix";

  programs.nixfmt.enable = true;
  programs.prettier.enable = true;

  settings = {
    formatter = {
      nixfmt.includes = [ "**/*.nix" ];

      prettier.includes = [
        "**/*.js"
        "**/*.ts"
        "**/*.css"
        "**/*.md"
      ];
      prettier.excludes = [ "**/*.html" ];
      prettier.options = [
        "--tab-width"
        "2"
        "--use-tabs"
        "false"
      ];

      hugo-djlint = {
        command = "sh";
        options = [
          "-c"
          ''
            ${pkgs.lib.getExe pkgs.djlint} --reformat --profile=golang --indent 2 "$@" || test $? -eq 1
          ''
          "--"
        ];
        includes = [ "**/*.html" ];
      };

      hugo-djlint.priority = 1;
      prettier.priority = 2;
      nixfmt.priority = 3;
    };

    global.excludes = [
      ".direnv/**"
      ".git/**"
      "public/**"
    ];
  };
}
