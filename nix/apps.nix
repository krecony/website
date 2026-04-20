{
  system,
  nixpkgs,
  ...
}:
let
  pkgs = nixpkgs.legacyPackages.${system};

  tailwind = pkgs.lib.getExe pkgs.tailwindcss;
in
{
  tw-build = {
    type = "app";
    program = toString (
      pkgs.writeShellScript "tw-build" ''
        set -euo pipefail
        ${tailwind} -c ./assets/tailwind.config.js -i ./assets/css/main.css -o ./assets/css/compiled/main.css --minify
      ''
    );
  };

  tw-watch = {
    type = "app";
    program = toString (
      pkgs.writeShellScript "tw-watch" ''
        set -euo pipefail
        ${tailwind} -c ./assets/tailwind.config.js -i ./assets/css/main.css -o ./assets/css/compiled/main.css --watch
      ''
    );
  };
}
