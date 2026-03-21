!macro preInit
  SetRegView 64
  WriteRegExpandStr HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation "C:\finance-hub"
  WriteRegExpandStr HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation "C:\finance-hub"
  SetRegView 32
  StrCpy $INSTDIR "C:\finance-hub"
!macroend
