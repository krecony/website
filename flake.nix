{
  inputs = {
    nipxkgs.url = "nixpkgs/nixos-unstable";
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

    in
    {
      formatter = forAllSystems (system: nixpkgs.legacyPackages.${system}.nixfmt-tree);
      checks = forAllSystems (
        system:
        import ./nix/checks.nix {
          inherit
            system
            self
            git-hooks
            lib
            ;
        }
      );

      devShells = forAllSystems (
        system:
        import ./nix/shell.nix {
          inherit system nixpkgs self;
        }
      );
    };
}
