{
  self,
  system,
  nixpkgs,
  ...
}:
let
  pkgs = nixpkgs.legacyPackages.${system};
  inherit (self.checks.${system}) pre-commit-check;
in
{
  default = pkgs.mkShell {
    buildInputs = pre-commit-check.enabledPackages;
    packages = with pkgs; [
      hugo
      tailwindcss
    ];
    shellHook = pre-commit-check.shellHook or "";
  };
}
