import bpy
import math
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
EXPORT_DIR = ROOT / "Exports" / "Weapons"
PREVIEW_DIR = ROOT / "Previews"
BLEND_DIR = ROOT / "Blend"
for folder in (EXPORT_DIR, PREVIEW_DIR, BLEND_DIR):
    folder.mkdir(parents=True, exist_ok=True)

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
for datablocks in (bpy.data.meshes, bpy.data.curves, bpy.data.materials, bpy.data.cameras, bpy.data.lights):
    pass

bpy.context.scene.unit_settings.system = "METRIC"
bpy.context.scene.unit_settings.scale_length = 1.0
bpy.context.scene.render.engine = "BLENDER_EEVEE"
bpy.context.scene.render.resolution_x = 1400
bpy.context.scene.render.resolution_y = 800
bpy.context.scene.render.resolution_percentage = 100
bpy.context.scene.render.image_settings.file_format = "PNG"
bpy.context.scene.render.film_transparent = False


def material(name, color, metallic=0.0, roughness=0.5):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1.0)
    mat.metallic = metallic
    mat.roughness = roughness
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get("Principled BSDF")
    if shader:
        shader.inputs["Base Color"].default_value = (*color, 1.0)
        shader.inputs["Metallic"].default_value = metallic
        shader.inputs["Roughness"].default_value = roughness
    return mat


WOOD = material("M_Wood_Oak", (0.24, 0.075, 0.025), 0.0, 0.42)
DARK_WOOD = material("M_Wood_Orc", (0.12, 0.032, 0.012), 0.0, 0.58)
STEEL = material("M_Steel", (0.19, 0.22, 0.23), 0.82, 0.22)
EDGE = material("M_Steel_Edge", (0.48, 0.54, 0.56), 0.92, 0.12)
IRON = material("M_Black_Iron", (0.035, 0.042, 0.043), 0.75, 0.3)
LEATHER = material("M_Leather", (0.095, 0.028, 0.012), 0.0, 0.68)
BONE = material("M_Orc_Bone", (0.42, 0.34, 0.21), 0.0, 0.57)


def apply_bevel(obj, width=0.01, segments=3):
    modifier = obj.modifiers.new("Bevel", "BEVEL")
    modifier.width = width
    modifier.segments = segments
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=modifier.name)


def cube(name, location, scale, mat, bevel=0.01, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    if bevel:
        apply_bevel(obj, bevel)
    return obj


def cylinder(name, location, radius, depth, mat, vertices=16, rotation=(0, 0, 0), scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    apply_bevel(obj, min(radius * 0.22, 0.012), 2)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return obj


def cone(name, location, radius1, radius2, depth, mat, vertices=16, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cone_add(vertices=vertices, radius1=radius1, radius2=radius2, depth=depth, location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    apply_bevel(obj, 0.008, 2)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return obj


def torus(name, location, major, minor, mat, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor, major_segments=20, minor_segments=6, location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    return obj


def join_weapon(objects, name):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.join()
    weapon = bpy.context.object
    weapon.name = name
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    bpy.context.scene.cursor.location = (0, 0, 0)
    bpy.ops.object.origin_set(type="ORIGIN_CURSOR")
    return weapon


def leather_wraps(z_start, z_end, radius, count=7):
    wraps = []
    for i in range(count):
        z = z_start + (z_end - z_start) * i / max(1, count - 1)
        wrap = torus(f"LeatherWrap_{i:02}", (0, 0, z), radius, 0.008, LEATHER)
        wrap.rotation_euler.z = i * 0.19
        wraps.append(wrap)
    return wraps


def build_hammer():
    parts = [cylinder("Hammer_Handle", (0, 0, 0.48), 0.035, 0.96, WOOD, 18, scale=(1.0, 0.92, 1.0))]
    parts += leather_wraps(0.10, 0.36, 0.038, 8)
    parts.append(cube("Hammer_Head", (0, 0, 0.93), (0.24, 0.085, 0.105), STEEL, 0.025))
    parts.append(cube("Hammer_Face_L", (-0.25, 0, 0.93), (0.035, 0.105, 0.125), EDGE, 0.012))
    parts.append(cube("Hammer_Face_R", (0.25, 0, 0.93), (0.035, 0.105, 0.125), EDGE, 0.012))
    parts.append(cylinder("Hammer_Collar", (0, 0, 0.80), 0.052, 0.10, IRON, 16))
    return join_weapon(parts, "SM_Bram_Hammer")


def build_axe():
    parts = [cylinder("Axe_Handle", (0, 0, 0.48), 0.032, 0.96, WOOD, 18, scale=(0.9, 1.05, 1.0))]
    parts += leather_wraps(0.10, 0.32, 0.035, 7)
    parts.append(cylinder("Axe_Collar", (0, 0, 0.82), 0.048, 0.10, IRON, 16))
    verts = [(-0.03, -0.035, 0.80), (-0.03, -0.035, 1.05), (-0.33, -0.022, 1.12), (-0.40, -0.018, 0.91),
             (-0.03, 0.035, 0.80), (-0.03, 0.035, 1.05), (-0.33, 0.022, 1.12), (-0.40, 0.018, 0.91)]
    faces = [(0, 1, 2, 3), (4, 7, 6, 5), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)]
    mesh = bpy.data.meshes.new("AxeBladeMesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    blade = bpy.data.objects.new("Axe_Blade", mesh)
    bpy.context.collection.objects.link(blade)
    blade.data.materials.append(STEEL)
    apply_bevel(blade, 0.012, 3)
    edge = cube("Axe_Cutting_Edge", (-0.38, 0, 0.985), (0.025, 0.045, 0.12), EDGE, 0.008, rotation=(0, -0.20, 0))
    parts.extend([blade, edge])
    return join_weapon(parts, "SM_Bram_WoodcutterAxe")


def orient_from_z(obj, direction):
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(Vector(direction).normalized())
    obj.rotation_mode = "XYZ"


def build_orc_club():
    parts = [cone("Club_Handle", (0, 0, 0.52), 0.045, 0.085, 1.04, DARK_WOOD, 18)]
    parts += leather_wraps(0.10, 0.40, 0.052, 8)
    parts.append(torus("Club_Band_Lower", (0, 0, 0.43), 0.061, 0.012, IRON))
    parts.append(torus("Club_Band_Upper", (0, 0, 0.83), 0.082, 0.014, IRON))
    head = cone("Club_Head", (0, 0, 1.02), 0.18, 0.12, 0.42, WOOD, 12)
    parts.append(head)
    for z in (0.90, 1.03, 1.16):
        parts.append(torus(f"Club_HeadBand_{z}", (0, 0, z), 0.155 - abs(1.03 - z) * 0.22, 0.018, IRON))
    directions = [(1, 0, .18), (-1, 0, .18), (0, 1, -.08), (0, -1, -.08), (.7, .7, .1), (-.7, .7, .1), (.7, -.7, .1), (-.7, -.7, .1)]
    for index, direction in enumerate(directions):
        z = 1.00 + (index % 3 - 1) * 0.10
        d = Vector(direction).normalized()
        spike = cone(f"Club_Spike_{index:02}", d * 0.18 + Vector((0, 0, z)), 0.045, 0.004, 0.18, IRON, 10)
        orient_from_z(spike, d)
        parts.append(spike)
    for index, angle in enumerate((0, math.pi / 2, math.pi, math.pi * 1.5)):
        stud = bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=6, radius=0.025, location=(math.cos(angle) * .15, math.sin(angle) * .15, 1.08))
        obj = bpy.context.object
        obj.name = f"Club_Stud_{index:02}"
        obj.data.materials.append(BONE)
        parts.append(obj)
    return join_weapon(parts, "SM_Bram_OrcWarClub")


weapons = [build_hammer(), build_axe(), build_orc_club()]


def export_fbx(obj):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    path = EXPORT_DIR / f"{obj.name}.fbx"
    try:
        bpy.ops.wm.fbx_export(filepath=str(path), export_selected_objects=True, apply_unit_scale=True, global_scale=1.0)
    except Exception:
        bpy.ops.export_scene.fbx(filepath=str(path), use_selection=True, apply_unit_scale=True, apply_scale_options="FBX_SCALE_UNITS", axis_forward="-Y", axis_up="Z", add_leaf_bones=False)


for weapon in weapons:
    export_fbx(weapon)

# Build a separate presentation collection without moving the export masters.
preview_collection = bpy.data.collections.new("Weapon_Preview")
bpy.context.scene.collection.children.link(preview_collection)
for index, weapon in enumerate(weapons):
    copy = weapon.copy()
    copy.data = weapon.data.copy()
    preview_collection.objects.link(copy)
    copy.name = f"PREVIEW_{weapon.name}"
    copy.location = ((index - 1) * 1.15, 0, 0.02)
    copy.rotation_euler = (math.radians(10), math.radians(-12), math.radians(-18))
    weapon.hide_render = True
    weapon.hide_viewport = True

floor = cube("Preview_Floor", (0, 0, -0.07), (2.4, 1.25, 0.06), material("M_Floor", (0.022, 0.028, 0.03), 0.15, 0.35), 0.03)
bpy.ops.object.light_add(type="AREA", location=(-2.5, -3.0, 4.5))
key = bpy.context.object
key.name = "Key_Light"
key.data.energy = 1100
key.data.shape = "DISK"
key.data.size = 4.0
bpy.ops.object.light_add(type="AREA", location=(3.5, 1.0, 2.5))
fill = bpy.context.object
fill.name = "Fill_Light"
fill.data.energy = 850
fill.data.color = (0.35, 0.55, 1.0)
fill.data.size = 3.0
bpy.ops.object.light_add(type="AREA", location=(0, 3.0, 4.0))
rim = bpy.context.object
rim.name = "Rim_Light"
rim.data.energy = 1200
rim.data.color = (1.0, 0.35, 0.12)
rim.data.size = 2.0

bpy.ops.object.camera_add(location=(3.3, -6.7, 2.8))
camera = bpy.context.object
camera.name = "Weapon_Preview_Camera"
direction = Vector((0, 0, 0.65)) - camera.location
camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
camera.data.lens = 55
bpy.context.scene.camera = camera
bpy.context.scene.world.color = (0.008, 0.012, 0.015)
bpy.context.scene.render.filepath = str(PREVIEW_DIR / "Bram_WeaponPack_Preview.png")
bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_DIR / "LegendOfBram_WeaponPack.blend"))
bpy.ops.render.render(write_still=True)
print(f"Created {BLEND_DIR / 'LegendOfBram_WeaponPack.blend'}")
print(f"Exported {len(weapons)} Unreal-ready weapon meshes to {EXPORT_DIR}")
