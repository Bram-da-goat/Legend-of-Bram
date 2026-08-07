# The Legend of Bram — Blender to Unreal

This workspace contains source `.blend` files and Unreal-ready exports for the realistic remake.

## Scale and naming

- Blender units are meters; Unreal imports the FBX files at centimeter scale.
- Static meshes use Unreal's `SM_` prefix.
- Materials use the `M_` prefix.
- Weapon origins are placed at the bottom of each grip for easy socket attachment.
- Forward is `-Y` and up is `Z` during FBX export.

## Generated weapon pack

- `SM_Bram_Hammer.fbx`
- `SM_Bram_WoodcutterAxe.fbx`
- `SM_Bram_OrcWarClub.fbx`

The editable source is `Blend/LegendOfBram_WeaponPack.blend`. A rendered look-development image is saved under `Previews`.

## Rebuild

Run Blender in the background from the repository root:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background --python 'unreal-blender\scripts\build_weapon_pack.py'
```

The next Blender milestone should be a rigged Bram character with sockets for these three weapons, followed by goblin and orc base meshes.
