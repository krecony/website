{
  system,
  git-hooks,
  self,
  lib,
  ...
}:
{
  pre-commit-check = git-hooks.lib.${system}.run {
    src = ./.;
    hooks = {
      format = {
        enable = true;
        name = "format";
        entry = "${lib.getExe self.formatter.${system}}";
        pass_filenames = false;
        always_run = true;
      };
      deadnix = {
        enable = true;
        settings.noUnderscore = true;
      };
    };
  };
}
