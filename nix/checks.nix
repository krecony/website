{
  system,
  git-hooks,
  self,
  lib,
  treefmtEval,
  ...
}:
let
  src = self.outPath;
in
{
  treefmt-check = treefmtEval.${system}.config.build.check src;

  pre-commit-check = git-hooks.lib.${system}.run {
    inherit src;
    hooks = {
      format = {
        enable = true;
        name = "format";
        entry = "${lib.getExe treefmtEval.${system}.config.build.wrapper} --fail-on-change --no-cache";
        pass_filenames = true;
        always_run = false;
        require_serial = true;
      };
      deadnix = {
        enable = true;
        settings.noUnderscore = true;
      };
    };
  };
}
