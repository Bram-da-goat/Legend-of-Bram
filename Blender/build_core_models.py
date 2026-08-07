from pathlib import Path
import math

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parent
BLEND_PATH = ROOT / "LegendOfBram_CoreModels.blend"

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
for datablocks in (bpy.data.meshes, bpy.data.curves, bpy.data.materials, bpy.data.cameras, bpy.data.lights):
    pass

scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 1600
scene.render.resolution_y = 1000
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.film_transparent = False
scene.view_settings.look = "AgX - Medium High Contrast"


def material(name, color, metallic=0.0, roughness=0.65, emission=None):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if emission:
        bsdf.inputs["Emission Color"].default_value = (*emission, 1)
        bsdf.inputs["Emission Strength"].default_value = 3.0
    return mat


SKIN = material("M_Skin", (0.58, 0.32, 0.18), 0, .76)
HAIR = material("M_Hair", (0.09, 0.035, 0.018), 0, .9)
BRAM_GREEN = material("M_BramGreen", (0.08, 0.24, 0.13), 0, .78)
BRAM_CLOAK = material("M_BramCloak", (0.035, 0.12, 0.07), 0, .94)
LEATHER = material("M_Leather", (0.15, 0.055, 0.022), 0, .84)
WOOD = material("M_Wood", (0.28, 0.095, 0.025), 0, .7)
DARK_WOOD = material("M_DarkWood", (0.10, 0.032, 0.012), 0, .82)
IRON = material("M_DarkIron", (0.055, 0.065, 0.07), .82, .28)
STEEL = material("M_Steel", (0.34, 0.40, 0.42), .88, .21)
SILVER = material("M_PolishedSteel", (0.70, 0.77, 0.79), .94, .12)
GOLD = material("M_BurnishedGold", (0.48, 0.25, 0.045), .72, .3)
GOBLIN = material("M_GoblinSkin", (0.19, 0.39, 0.08), 0, .9)
ORC = material("M_OrcSkin", (0.17, 0.30, 0.10), 0, .92)
ZOMBIE = material("M_ZombieSkin", (0.24, 0.32, 0.21), 0, .95)
BONE = material("M_Bone", (0.66, 0.59, 0.42), 0, .72)
ROBE = material("M_NecromancerRobe", (0.025, 0.03, 0.026), 0, .88)
NECRO_GREEN = material("M_NecroGreen", (0.04, 0.38, 0.10), .15, .26, (0.02, .55, .09))
STONE = material("M_Stone", (0.23, 0.25, 0.23), 0, .94)
STONE_LIGHT = material("M_StoneLight", (0.40, 0.40, 0.35), 0, .9)
GRASS = material("M_Grass", (0.12, 0.28, 0.13), 0, .98)
LEAF = material("M_Leaf", (0.07, 0.22, 0.09), 0, .96)
ROOF_RED = material("M_RoofRed", (0.25, 0.06, 0.035), 0, .92)
ROOF_BLUE = material("M_RoofBlue", (0.06, 0.12, 0.15), 0, .9)
PLASTER = material("M_Plaster", (0.48, 0.40, 0.29), 0, .94)
PORTAL = material("M_Portal", (0.035, 0.34, 0.68), .12, .17, (0.02, .45, 1.0))
FIRE = material("M_Fire", (0.95, .28, .025), 0, .2, (1.0, .15, .01))
BLACK = material("M_Black", (.006, .008, .008), 0, 1)


def bevel(obj, width=.03, segments=3):
    mod = obj.modifiers.new("Weighted_Bevel", "BEVEL")
    mod.width = width
    mod.segments = segments
    return obj


def cube(name, loc, scale, mat, bevel_width=.025, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(location=loc, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    bevel(obj, bevel_width)
    return obj


def cylinder(name, loc, radius, depth, mat, vertices=16, rotation=(0, 0, 0), radius2=None):
    if radius2 is None:
        bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc, rotation=rotation)
    else:
        bpy.ops.mesh.primitive_cone_add(vertices=vertices, radius1=radius, radius2=radius2, depth=depth, location=loc, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    bevel(obj, min(radius * .16, .035), 2)
    return obj


def sphere(name, loc, scale, mat, segments=16):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=max(8, segments // 2), location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    return obj


def cone(name, loc, radius1, radius2, depth, mat, vertices=12, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cone_add(vertices=vertices, radius1=radius1, radius2=radius2, depth=depth, location=loc, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    bevel(obj, min(radius1 * .12, .025), 2)
    return obj


def torus(name, loc, major, minor, mat, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor, major_segments=20, minor_segments=8, location=loc, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    return obj


def between(name, a, b, radius, mat, vertices=12):
    start, end = Vector(a), Vector(b)
    direction = end - start
    obj = cylinder(name, (start + end) / 2, radius, direction.length, mat, vertices)
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(direction.normalized())
    obj.rotation_mode = "XYZ"
    return obj


def finish(parts, name):
    bpy.ops.object.select_all(action="DESELECT")
    for part in parts:
        part.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    obj = bpy.context.object
    obj.name = name
    bpy.context.scene.cursor.location = (0, 0, 0)
    bpy.ops.object.origin_set(type="ORIGIN_CURSOR")
    obj["asset_role"] = "Legend of Bram core model"
    return obj


def eyes(parts, y, z, spacing, size=.04, color=BLACK):
    parts += [sphere("Eye_L", (-spacing, y, z), (size, size * .45, size), color, 10),
              sphere("Eye_R", (spacing, y, z), (size, size * .45, size), color, 10)]


def build_bram():
    p = [cylinder("Bram_Torso", (0, 0, 1.35), .43, .9, BRAM_GREEN, 14, radius2=.32),
         cone("Bram_Cloak", (0, .16, 1.24), .55, .30, 1.18, BRAM_CLOAK, 14),
         sphere("Bram_Head", (0, -.02, 2.05), (.31, .29, .34), SKIN),
         sphere("Bram_Hair", (0, .02, 2.28), (.325, .30, .15), HAIR),
         cone("Bram_Beard", (0, -.285, 1.91), .20, .08, .42, HAIR, 10, (math.pi / 2, 0, 0)),
         cube("Bram_Belt", (0, 0, 1.12), (.42, .32, .07), LEATHER, .035),
         cube("Bram_Buckle", (0, -.335, 1.12), (.09, .035, .08), GOLD, .018)]
    p += [between("Bram_Arm_L", (-.34, 0, 1.62), (-.56, -.05, 1.18), .11, SKIN),
          between("Bram_Arm_R", (.34, 0, 1.62), (.56, -.05, 1.18), .11, SKIN),
          between("Bram_Leg_L", (-.18, 0, 1.02), (-.18, 0, .36), .14, BRAM_GREEN),
          between("Bram_Leg_R", (.18, 0, 1.02), (.18, 0, .36), .14, BRAM_GREEN),
          cube("Bram_Boot_L", (-.18, -.09, .18), (.17, .29, .16), LEATHER, .05),
          cube("Bram_Boot_R", (.18, -.09, .18), (.17, .29, .16), LEATHER, .05),
          sphere("Bram_Pauldron_L", (-.39, 0, 1.69), (.22, .25, .18), STEEL),
          sphere("Bram_Pauldron_R", (.39, 0, 1.69), (.22, .25, .18), STEEL)]
    eyes(p, -.285, 2.09, .105, .035)
    return finish(p, "CH_Bram")


def build_goblin():
    p = [cylinder("Goblin_Torso", (0, 0, .78), .30, .62, GOBLIN, 12, radius2=.22),
         sphere("Goblin_Head", (0, -.03, 1.30), (.33, .29, .27), GOBLIN, 14),
         cone("Goblin_Ear_L", (-.38, -.02, 1.34), .15, .015, .44, GOBLIN, 8, (0, math.pi / 2, 0)),
         cone("Goblin_Ear_R", (.38, -.02, 1.34), .15, .015, .44, GOBLIN, 8, (0, -math.pi / 2, 0)),
         cube("Goblin_Loincloth", (0, -.19, .57), (.31, .16, .22), LEATHER, .035),
         between("Goblin_Arm_L", (-.25, 0, .93), (-.42, -.07, .53), .085, GOBLIN),
         between("Goblin_Arm_R", (.25, 0, .93), (.43, -.07, .55), .085, GOBLIN),
         between("Goblin_Leg_L", (-.14, 0, .55), (-.18, 0, .13), .10, GOBLIN),
         between("Goblin_Leg_R", (.14, 0, .55), (.18, 0, .13), .10, GOBLIN)]
    eyes(p, -.285, 1.35, .11, .045)
    p += [cone("Goblin_Tooth_L", (-.08, -.295, 1.19), .035, .002, .13, BONE, 8, (math.pi, 0, 0)),
          cone("Goblin_Tooth_R", (.08, -.295, 1.19), .035, .002, .13, BONE, 8, (math.pi, 0, 0))]
    return finish(p, "CH_Goblin")


def build_orc():
    p = [cylinder("Orc_Torso", (0, 0, 1.32), .58, 1.12, ORC, 14, radius2=.48),
         sphere("Orc_Head", (0, -.03, 2.13), (.43, .38, .40), ORC),
         between("Orc_Arm_L", (-.50, 0, 1.62), (-.72, -.08, .88), .17, ORC, 14),
         between("Orc_Arm_R", (.50, 0, 1.62), (.72, -.08, .88), .17, ORC, 14),
         between("Orc_Leg_L", (-.26, 0, .88), (-.30, 0, .25), .20, ORC, 14),
         between("Orc_Leg_R", (.26, 0, .88), (.30, 0, .25), .20, ORC, 14),
         cube("Orc_Harness_A", (0, -.52, 1.43), (.07, .055, .61), LEATHER, .02, (0, .42, .40)),
         cube("Orc_Harness_B", (0, -.52, 1.43), (.07, .055, .61), LEATHER, .02, (0, -.42, -.40)),
         cube("Orc_Belt", (0, 0, .92), (.55, .38, .09), IRON, .03),
         sphere("Orc_Pauldron", (-.53, 0, 1.77), (.33, .39, .23), IRON),
         cube("Orc_Boot_L", (-.30, -.10, .16), (.24, .34, .16), LEATHER, .06),
         cube("Orc_Boot_R", (.30, -.10, .16), (.24, .34, .16), LEATHER, .06)]
    eyes(p, -.385, 2.18, .15, .05)
    p += [cone("Orc_Tusk_L", (-.16, -.39, 2.00), .055, .008, .24, BONE, 9, (math.pi, 0, 0)),
          cone("Orc_Tusk_R", (.16, -.39, 2.00), .055, .008, .24, BONE, 9, (math.pi, 0, 0))]
    return finish(p, "CH_Orc")


def build_knight():
    p = [cylinder("Knight_Cuirass", (0, 0, 1.25), .43, .92, STEEL, 14, radius2=.34),
         sphere("Knight_Helmet", (0, 0, 2.02), (.36, .34, .40), STEEL),
         cube("Knight_Visor", (0, -.345, 2.02), (.33, .05, .13), IRON, .025),
         cone("Knight_HelmetSpike", (0, 0, 2.54), .08, .006, .42, STEEL, 10),
         between("Knight_Arm_L", (-.35, 0, 1.58), (-.52, -.08, 1.00), .13, STEEL),
         between("Knight_Arm_R", (.35, 0, 1.58), (.52, -.08, 1.00), .13, STEEL),
         between("Knight_Leg_L", (-.18, 0, .92), (-.20, 0, .28), .15, IRON),
         between("Knight_Leg_R", (.18, 0, .92), (.20, 0, .28), .15, IRON),
         sphere("Knight_Pauldron_L", (-.42, 0, 1.65), (.25, .29, .18), SILVER),
         sphere("Knight_Pauldron_R", (.42, 0, 1.65), (.25, .29, .18), SILVER),
         cube("Knight_Shield", (-.63, -.16, 1.10), (.34, .10, .53), STEEL, .09),
         torus("Knight_ShieldRim", (-.63, -.28, 1.10), .28, .035, GOLD, (math.pi / 2, 0, 0))]
    for x in (-.20, -.10, 0, .10, .20):
        p.append(cube("Knight_VisorSlot", (x, -.402, 2.02), (.025, .012, .035), BLACK, .005))
    return finish(p, "CH_Knight")


def build_necromancer():
    p = [cone("Necromancer_Robe", (0, 0, .95), .63, .25, 1.85, ROBE, 16),
         sphere("Necromancer_Hood", (0, 0, 1.98), (.43, .39, .46), ROBE),
         sphere("Necromancer_Skull", (0, -.35, 1.97), (.24, .10, .28), BONE, 14),
         cone("Necromancer_Sleeve_L", (-.40, 0, 1.43), .21, .10, .72, ROBE, 12, (0, -.40, -.42)),
         cone("Necromancer_Sleeve_R", (.40, 0, 1.43), .21, .10, .72, ROBE, 12, (0, .40, .42)),
         between("Necromancer_Staff", (.58, -.08, .12), (.58, -.08, 2.55), .045, DARK_WOOD, 12),
         torus("Necromancer_StaffRing", (.58, -.08, 2.66), .20, .045, IRON, (math.pi / 2, 0, 0)),
         sphere("Necromancer_Crystal", (.58, -.08, 2.66), (.13, .13, .22), NECRO_GREEN, 10)]
    eyes(p, -.455, 2.02, .085, .035, NECRO_GREEN)
    for angle in (-.55, 0, .55):
        p.append(cone("Necromancer_CrownHorn", (math.sin(angle) * .22, 0, 2.43), .055, .005, .38, BONE, 8, (0, angle, 0)))
    return finish(p, "CH_Necromancer")


def build_zombie():
    p = [cylinder("Zombie_Torso", (0, 0, 1.45), .35, 1.02, ZOMBIE, 12, radius2=.29),
         sphere("Zombie_Head", (0, -.05, 2.19), (.31, .29, .36), ZOMBIE, 14),
         between("Zombie_Arm_L", (-.30, 0, 1.70), (-.63, -.28, 1.16), .095, ZOMBIE),
         between("Zombie_Arm_R", (.30, 0, 1.70), (.63, -.28, 1.16), .095, ZOMBIE),
         between("Zombie_Leg_L", (-.16, 0, 1.00), (-.23, 0, .22), .12, ROBE),
         between("Zombie_Leg_R", (.16, 0, 1.00), (.23, 0, .22), .12, ROBE),
         cube("Zombie_ShirtTear", (.16, -.34, 1.48), (.16, .025, .24), LEATHER, .01, (0, 0, .25))]
    eyes(p, -.292, 2.23, .105, .04, NECRO_GREEN)
    return finish(p, "CH_Zombie")


def build_teleporter():
    p = [cylinder("Portal_Base", (0, 0, .18), 1.75, .36, STONE, 20, radius2=1.95),
         torus("Portal_Ring", (0, 0, 1.82), 1.35, .19, STONE, (math.pi / 2, 0, 0)),
         torus("Portal_Energy", (0, -.03, 1.82), 1.05, .075, PORTAL, (math.pi / 2, 0, 0))]
    for i in range(8):
        a = i * math.tau / 8
        p.append(sphere("Portal_Rune", (math.cos(a) * 1.35, -.20, 1.82 + math.sin(a) * 1.35), (.09, .05, .09), PORTAL, 10))
    for x in (-1.55, 1.55):
        p.append(cone("Portal_Crystal", (x, 0, .72), .18, .03, .75, PORTAL, 6))
    return finish(p, "SM_Teleporter")


def build_tree():
    p = [cylinder("Tree_Trunk", (0, 0, 1.75), .34, 3.5, WOOD, 12, radius2=.22)]
    for loc, scale in [((0, 0, 3.75), (1.35, 1.05, 1.45)), ((.60, .10, 4.20), (.95, .80, 1.05)), ((-.58, .05, 4.12), (.88, .78, 1.0))]:
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1, location=loc)
        crown = bpy.context.object
        crown.name = "Tree_Crown"
        crown.scale = scale
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        crown.data.materials.append(LEAF)
        p.append(crown)
    return finish(p, "SM_MeadowTree")


def build_boulder():
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1, location=(0, 0, .72))
    rock = bpy.context.object
    rock.name = "Meadow_Boulder"
    rock.scale = (1.25, .95, .72)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    rock.data.materials.append(STONE_LIGHT)
    return finish([rock], "SM_MeadowBoulder")


def build_outcrop():
    p = []
    for i, (x, y, z, s) in enumerate([(-.8, 0, 1.0, 1.4), (.7, .1, 1.25, 1.65), (0, -.2, 2.35, 1.35), (1.45, .25, .65, .85)]):
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=s, location=(x, y, z))
        rock = bpy.context.object
        rock.name = f"Outcrop_Rock_{i}"
        rock.scale.z = 1.25
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        rock.data.materials.append(STONE if i % 2 else STONE_LIGHT)
        p.append(rock)
    return finish(p, "SM_MountainOutcrop")


def build_gate():
    p = [cube("Gate_Pillar_L", (-1.35, 0, 1.55), (.48, .58, 1.55), STONE, .10),
         cube("Gate_Pillar_R", (1.35, 0, 1.55), (.48, .58, 1.55), STONE, .10),
         cube("Gate_Lintel", (0, 0, 3.05), (1.85, .62, .40), STONE_LIGHT, .10),
         cube("Gate_Door_L", (-.62, .05, 1.28), (.62, .18, 1.28), DARK_WOOD, .05),
         cube("Gate_Door_R", (.62, .05, 1.28), (.62, .18, 1.28), DARK_WOOD, .05)]
    for x in (-1.05, -.62, -.19, .19, .62, 1.05):
        p.append(cube("Gate_IronBrace", (x, -.15, 1.28), (.035, .035, 1.18), IRON, .01))
    return finish(p, "SM_StoneGate")


def building(name, wall_mat, roof_mat, forge=False):
    p = [cube("Building_Walls", (0, 0, 1.55), (2.35, 1.85, 1.55), wall_mat, .08),
         cube("Building_Door", (0, -1.88, .85), (.48, .10, .85), DARK_WOOD, .035),
         cube("Building_BeamTop", (0, -1.95, 2.65), (2.30, .12, .10), DARK_WOOD, .025)]
    for x in (-2.15, 0, 2.15):
        p.append(cube("Building_Timber", (x, -1.95, 1.60), (.10, .10, 1.45), DARK_WOOD, .02))
    for x in (-1.25, 1.25):
        p.append(cube("Building_Window", (x, -1.96, 1.65), (.40, .06, .48), FIRE, .025))
    p += [cube("Roof_Left", (-1.20, 0, 3.45), (1.55, 2.15, .16), roof_mat, .035, (0, -.58, 0)),
          cube("Roof_Right", (1.20, 0, 3.45), (1.55, 2.15, .16), roof_mat, .035, (0, .58, 0)),
          cube("Chimney", (1.48, .65, 4.20), (.30, .34, .95), STONE, .055)]
    if forge:
        p += [cube("Forge_AnvilBase", (-1.0, -2.55, .42), (.38, .38, .42), STONE, .04),
              cube("Forge_Anvil", (-1.0, -2.55, .88), (.62, .28, .18), IRON, .04),
              sphere("Forge_Fire", (1.0, -2.38, .55), (.42, .25, .42), FIRE, 12)]
    return finish(p, name)


def build_altar():
    p = [cylinder("Altar_Base", (0, 0, .24), 1.35, .48, STONE, 12, radius2=1.55),
         cylinder("Altar_Step", (0, 0, .62), .95, .32, STONE_LIGHT, 12, radius2=1.10),
         cube("Altar_Pillar", (0, 0, 1.45), (.40, .40, .75), STONE_LIGHT, .07),
         sphere("Altar_Flame", (0, 0, 2.45), (.36, .36, .58), PORTAL, 14)]
    for i in range(4):
        a = i * math.pi / 2
        p.append(cone("Altar_Spire", (math.cos(a) * .85, math.sin(a) * .85, 1.0), .12, .02, .75, STONE, 8))
    return finish(p, "SM_AltarOfSteve")


def build_crate():
    p = [cube("Crate_Box", (0, 0, .55), (.55, .55, .55), WOOD, .025)]
    for z in (.10, 1.0):
        p.append(cube("Crate_Band", (0, -.57, z), (.58, .04, .07), IRON, .01))
    p += [cube("Crate_Diagonal_A", (0, -.59, .55), (.07, .04, .62), DARK_WOOD, .01, (0, 0, .72)),
          cube("Crate_Diagonal_B", (0, -.60, .55), (.07, .04, .62), DARK_WOOD, .01, (0, 0, -.72))]
    return finish(p, "SM_Crate")


def build_barrel():
    p = [cylinder("Barrel_Body", (0, 0, .72), .52, 1.44, WOOD, 16, radius2=.52)]
    for z in (.16, .72, 1.28):
        p.append(torus("Barrel_Band", (0, 0, z), .51, .045, IRON))
    return finish(p, "SM_Barrel")


characters = [build_bram(), build_goblin(), build_orc(), build_knight(), build_necromancer(), build_zombie()]
world_models = [
    build_teleporter(), build_tree(), build_boulder(), build_outcrop(), build_gate(),
    building("SM_Blacksmith", PLASTER, ROOF_RED, True),
    building("SM_Shop", PLASTER, ROOF_BLUE, False),
    building("SM_TownHouse", STONE_LIGHT, ROOF_RED, False),
    build_altar(), build_crate(), build_barrel(),
]
models = characters + world_models


def export_fbx(obj):
    bpy.ops.object.select_all(action="DESELECT")
    obj.hide_viewport = False
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    try:
        bpy.ops.wm.fbx_export(filepath=str(ROOT / f"{obj.name}.fbx"), export_selected_objects=True,
                              apply_unit_scale=True, global_scale=1.0)
    except Exception:
        bpy.ops.export_scene.fbx(filepath=str(ROOT / f"{obj.name}.fbx"), use_selection=True,
                                 apply_unit_scale=True, axis_forward="-Y", axis_up="Z", add_leaf_bones=False)
    obj.hide_viewport = True


for model in models:
    export_fbx(model)
    model.hide_render = True
    model.hide_viewport = True


def preview_collection(name, objects, positions, scales):
    collection = bpy.data.collections.new(name)
    scene.collection.children.link(collection)
    for obj, pos, scale in zip(objects, positions, scales):
        copy = obj.copy()
        copy.data = obj.data.copy()
        collection.objects.link(copy)
        copy.name = f"PREVIEW_{obj.name}"
        copy.location = pos
        copy.scale = (scale, scale, scale)
        copy.rotation_euler = (0, 0, math.radians(-8))
        copy.hide_render = False
        copy.hide_viewport = False
    return collection


char_positions = [(-4.5, 0, 0), (-2.7, 0, 0), (-.9, 0, 0), (1.15, 0, 0), (3.15, 0, 0), (4.8, 0, 0)]
char_preview = preview_collection("PREVIEW_Characters", characters, char_positions, [1, 1.2, 1, 1, 1, 1])
world_positions = [(-4.6, 1.5, 0), (-2.25, 1.5, 0), (0, 1.5, 0), (2.25, 1.5, 0), (4.65, 1.5, 0),
                   (-4.6, -1.5, 0), (-2.25, -1.5, 0), (0, -1.5, 0), (2.25, -1.5, 0), (4.15, -1.5, 0), (5.15, -1.5, 0)]
world_scales = [.55, .42, .72, .40, .48, .30, .30, .30, .45, .72, .72]
world_preview = preview_collection("PREVIEW_World", world_models, world_positions, world_scales)

floor = cube("Preview_Floor", (0, 0, -.10), (7.4, 3.8, .09), material("M_PreviewFloor", (.018, .024, .023), .05, .38), .04)
bpy.ops.object.light_add(type="AREA", location=(-4, -5, 7))
key = bpy.context.object
key.data.energy = 1550
key.data.shape = "DISK"
key.data.size = 5
bpy.ops.object.light_add(type="AREA", location=(5, 1, 4))
fill = bpy.context.object
fill.data.energy = 1100
fill.data.color = (.30, .52, 1.0)
fill.data.size = 4
bpy.ops.object.light_add(type="AREA", location=(0, 4, 6))
rim = bpy.context.object
rim.data.energy = 1450
rim.data.color = (1.0, .30, .08)
rim.data.size = 3
bpy.ops.object.camera_add(location=(8.5, -14.5, 7.6))
camera = bpy.context.object
camera.data.lens = 58
scene.camera = camera
scene.world.color = (.006, .009, .009)


def aim_camera(target):
    camera.rotation_euler = (Vector(target) - camera.location).to_track_quat("-Z", "Y").to_euler()


world_preview.hide_render = True
aim_camera((0, 0, 1.25))
scene.render.filepath = str(ROOT / "Bram_CoreCharacters_Preview.png")
bpy.ops.render.render(write_still=True)

char_preview.hide_render = True
world_preview.hide_render = False
camera.location = (9.2, -16.8, 9.0)
aim_camera((0, 0, 1.15))
scene.render.filepath = str(ROOT / "Bram_WorldModels_Preview.png")
bpy.ops.render.render(write_still=True)

bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))
print(f"Created {BLEND_PATH}")
print(f"Exported {len(models)} core model FBXs to {ROOT}")
