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
    inherit (pre-commit-check) shellHook;
    buildInputs = pre-commit-check.enabledPackages;
    packages = with pkgs; [
      hugo
    ];
  };
}
