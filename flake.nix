{
  inputs = {
    nipxkgs.url = "nixpkgs/nixos-unstable";
    treefmt-nix.url = "github:numtide/treefmt-nix";
    git-hooks = {
      url = "github:cachix/git-hooks.nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    {
      self,
      nixpkgs,
      git-hooks,
      treefmt-nix,
      ...
    }:
    let
      inherit (nixpkgs) lib;
      forAllSystems = lib.genAttrs [
        "aarch64-darwin"
        "aarch64-linux"
        "x86_64-darwin"
        "x86_64-linux"
      ];

      treefmtEval = forAllSystems (
        system: import ./nix/format.nix nixpkgs.legacyPackages.${system} treefmt-nix
      );
    in
    {
      formatter = forAllSystems (system: treefmtEval.${system}.config.build.wrapper);

      checks = forAllSystems (
        system:
        import ./nix/checks.nix {
          inherit
            system
            self
            git-hooks
            lib
            treefmtEval
            ;
        }
      );

      devShells = forAllSystems (
        system:
        import ./nix/shell.nix {
          inherit system nixpkgs self;
        }
      );

      apps = forAllSystems (
        system:
        import ./nix/apps.nix {
          inherit system nixpkgs self;
        }
      );
    };
}
