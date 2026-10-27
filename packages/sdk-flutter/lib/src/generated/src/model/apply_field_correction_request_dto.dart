//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'apply_field_correction_request_dto.g.dart';

/// ApplyFieldCorrectionRequestDto
///
/// Properties:
/// * [id] 
/// * [op] 
/// * [fieldKey] 
/// * [page] 
/// * [shape] 
/// * [x0] 
/// * [y0] 
/// * [x1] 
/// * [y1] 
/// * [blockIndexes] 
/// * [valueOverride] 
/// * [scope] 
/// * [tagId] 
/// * [beforeRegionId] 
@BuiltValue()
abstract class ApplyFieldCorrectionRequestDto implements Built<ApplyFieldCorrectionRequestDto, ApplyFieldCorrectionRequestDtoBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'op')
  ApplyFieldCorrectionRequestDtoOpEnum get op;
  // enum opEnum {  create,  reanchor,  edit_value,  remove,  };

  @BuiltValueField(wireName: r'fieldKey')
  String get fieldKey;

  @BuiltValueField(wireName: r'page')
  num? get page;

  @BuiltValueField(wireName: r'shape')
  ApplyFieldCorrectionRequestDtoShapeEnum? get shape;
  // enum shapeEnum {  rect,  polygon,  };

  @BuiltValueField(wireName: r'x0')
  num? get x0;

  @BuiltValueField(wireName: r'y0')
  num? get y0;

  @BuiltValueField(wireName: r'x1')
  num? get x1;

  @BuiltValueField(wireName: r'y1')
  num? get y1;

  @BuiltValueField(wireName: r'blockIndexes')
  BuiltList<num>? get blockIndexes;

  @BuiltValueField(wireName: r'valueOverride')
  String? get valueOverride;

  @BuiltValueField(wireName: r'scope')
  ApplyFieldCorrectionRequestDtoScopeEnum? get scope;
  // enum scopeEnum {  document,  label,  always,  };

  @BuiltValueField(wireName: r'tagId')
  String? get tagId;

  @BuiltValueField(wireName: r'beforeRegionId')
  String? get beforeRegionId;

  ApplyFieldCorrectionRequestDto._();

  factory ApplyFieldCorrectionRequestDto([void updates(ApplyFieldCorrectionRequestDtoBuilder b)]) = _$ApplyFieldCorrectionRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ApplyFieldCorrectionRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ApplyFieldCorrectionRequestDto> get serializer => _$ApplyFieldCorrectionRequestDtoSerializer();
}

class _$ApplyFieldCorrectionRequestDtoSerializer implements PrimitiveSerializer<ApplyFieldCorrectionRequestDto> {
  @override
  final Iterable<Type> types = const [ApplyFieldCorrectionRequestDto, _$ApplyFieldCorrectionRequestDto];

  @override
  final String wireName = r'ApplyFieldCorrectionRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ApplyFieldCorrectionRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'op';
    yield serializers.serialize(
      object.op,
      specifiedType: const FullType(ApplyFieldCorrectionRequestDtoOpEnum),
    );
    yield r'fieldKey';
    yield serializers.serialize(
      object.fieldKey,
      specifiedType: const FullType(String),
    );
    if (object.page != null) {
      yield r'page';
      yield serializers.serialize(
        object.page,
        specifiedType: const FullType(num),
      );
    }
    if (object.shape != null) {
      yield r'shape';
      yield serializers.serialize(
        object.shape,
        specifiedType: const FullType(ApplyFieldCorrectionRequestDtoShapeEnum),
      );
    }
    if (object.x0 != null) {
      yield r'x0';
      yield serializers.serialize(
        object.x0,
        specifiedType: const FullType(num),
      );
    }
    if (object.y0 != null) {
      yield r'y0';
      yield serializers.serialize(
        object.y0,
        specifiedType: const FullType(num),
      );
    }
    if (object.x1 != null) {
      yield r'x1';
      yield serializers.serialize(
        object.x1,
        specifiedType: const FullType(num),
      );
    }
    if (object.y1 != null) {
      yield r'y1';
      yield serializers.serialize(
        object.y1,
        specifiedType: const FullType(num),
      );
    }
    if (object.blockIndexes != null) {
      yield r'blockIndexes';
      yield serializers.serialize(
        object.blockIndexes,
        specifiedType: const FullType(BuiltList, [FullType(num)]),
      );
    }
    if (object.valueOverride != null) {
      yield r'valueOverride';
      yield serializers.serialize(
        object.valueOverride,
        specifiedType: const FullType(String),
      );
    }
    if (object.scope != null) {
      yield r'scope';
      yield serializers.serialize(
        object.scope,
        specifiedType: const FullType(ApplyFieldCorrectionRequestDtoScopeEnum),
      );
    }
    if (object.tagId != null) {
      yield r'tagId';
      yield serializers.serialize(
        object.tagId,
        specifiedType: const FullType(String),
      );
    }
    if (object.beforeRegionId != null) {
      yield r'beforeRegionId';
      yield serializers.serialize(
        object.beforeRegionId,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    ApplyFieldCorrectionRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ApplyFieldCorrectionRequestDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        case r'op':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(ApplyFieldCorrectionRequestDtoOpEnum),
          ) as ApplyFieldCorrectionRequestDtoOpEnum;
          result.op = valueDes;
          break;
        case r'fieldKey':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.fieldKey = valueDes;
          break;
        case r'page':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.page = valueDes;
          break;
        case r'shape':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(ApplyFieldCorrectionRequestDtoShapeEnum),
          ) as ApplyFieldCorrectionRequestDtoShapeEnum;
          result.shape = valueDes;
          break;
        case r'x0':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.x0 = valueDes;
          break;
        case r'y0':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.y0 = valueDes;
          break;
        case r'x1':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.x1 = valueDes;
          break;
        case r'y1':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.y1 = valueDes;
          break;
        case r'blockIndexes':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(num)]),
          ) as BuiltList<num>;
          result.blockIndexes.replace(valueDes);
          break;
        case r'valueOverride':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.valueOverride = valueDes;
          break;
        case r'scope':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(ApplyFieldCorrectionRequestDtoScopeEnum),
          ) as ApplyFieldCorrectionRequestDtoScopeEnum;
          result.scope = valueDes;
          break;
        case r'tagId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.tagId = valueDes;
          break;
        case r'beforeRegionId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.beforeRegionId = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ApplyFieldCorrectionRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ApplyFieldCorrectionRequestDtoBuilder();
    final serializedList = (serialized as Iterable<Object?>).toList();
    final unhandled = <Object?>[];
    _deserializeProperties(
      serializers,
      serialized,
      specifiedType: specifiedType,
      serializedList: serializedList,
      unhandled: unhandled,
      result: result,
    );
    return result.build();
  }
}

class ApplyFieldCorrectionRequestDtoOpEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'create')
  static const ApplyFieldCorrectionRequestDtoOpEnum create = _$applyFieldCorrectionRequestDtoOpEnum_create;
  @BuiltValueEnumConst(wireName: r'reanchor')
  static const ApplyFieldCorrectionRequestDtoOpEnum reanchor = _$applyFieldCorrectionRequestDtoOpEnum_reanchor;
  @BuiltValueEnumConst(wireName: r'edit_value')
  static const ApplyFieldCorrectionRequestDtoOpEnum editValue = _$applyFieldCorrectionRequestDtoOpEnum_editValue;
  @BuiltValueEnumConst(wireName: r'remove')
  static const ApplyFieldCorrectionRequestDtoOpEnum remove = _$applyFieldCorrectionRequestDtoOpEnum_remove;

  static Serializer<ApplyFieldCorrectionRequestDtoOpEnum> get serializer => _$applyFieldCorrectionRequestDtoOpEnumSerializer;

  const ApplyFieldCorrectionRequestDtoOpEnum._(String name): super(name);

  static BuiltSet<ApplyFieldCorrectionRequestDtoOpEnum> get values => _$applyFieldCorrectionRequestDtoOpEnumValues;
  static ApplyFieldCorrectionRequestDtoOpEnum valueOf(String name) => _$applyFieldCorrectionRequestDtoOpEnumValueOf(name);
}

class ApplyFieldCorrectionRequestDtoShapeEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'rect')
  static const ApplyFieldCorrectionRequestDtoShapeEnum rect = _$applyFieldCorrectionRequestDtoShapeEnum_rect;
  @BuiltValueEnumConst(wireName: r'polygon')
  static const ApplyFieldCorrectionRequestDtoShapeEnum polygon = _$applyFieldCorrectionRequestDtoShapeEnum_polygon;

  static Serializer<ApplyFieldCorrectionRequestDtoShapeEnum> get serializer => _$applyFieldCorrectionRequestDtoShapeEnumSerializer;

  const ApplyFieldCorrectionRequestDtoShapeEnum._(String name): super(name);

  static BuiltSet<ApplyFieldCorrectionRequestDtoShapeEnum> get values => _$applyFieldCorrectionRequestDtoShapeEnumValues;
  static ApplyFieldCorrectionRequestDtoShapeEnum valueOf(String name) => _$applyFieldCorrectionRequestDtoShapeEnumValueOf(name);
}

class ApplyFieldCorrectionRequestDtoScopeEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'document')
  static const ApplyFieldCorrectionRequestDtoScopeEnum document = _$applyFieldCorrectionRequestDtoScopeEnum_document;
  @BuiltValueEnumConst(wireName: r'label')
  static const ApplyFieldCorrectionRequestDtoScopeEnum label = _$applyFieldCorrectionRequestDtoScopeEnum_label;
  @BuiltValueEnumConst(wireName: r'always')
  static const ApplyFieldCorrectionRequestDtoScopeEnum always = _$applyFieldCorrectionRequestDtoScopeEnum_always;

  static Serializer<ApplyFieldCorrectionRequestDtoScopeEnum> get serializer => _$applyFieldCorrectionRequestDtoScopeEnumSerializer;

  const ApplyFieldCorrectionRequestDtoScopeEnum._(String name): super(name);

  static BuiltSet<ApplyFieldCorrectionRequestDtoScopeEnum> get values => _$applyFieldCorrectionRequestDtoScopeEnumValues;
  static ApplyFieldCorrectionRequestDtoScopeEnum valueOf(String name) => _$applyFieldCorrectionRequestDtoScopeEnumValueOf(name);
}

