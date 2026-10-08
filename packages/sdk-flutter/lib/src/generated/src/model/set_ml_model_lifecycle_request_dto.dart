//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'set_ml_model_lifecycle_request_dto.g.dart';

/// SetMlModelLifecycleRequestDto
///
/// Properties:
/// * [lifecycle] 
@BuiltValue()
abstract class SetMlModelLifecycleRequestDto implements Built<SetMlModelLifecycleRequestDto, SetMlModelLifecycleRequestDtoBuilder> {
  @BuiltValueField(wireName: r'lifecycle')
  SetMlModelLifecycleRequestDtoLifecycleEnum get lifecycle;
  // enum lifecycleEnum {  failed,  active,  registered,  canary,  archived,  };

  SetMlModelLifecycleRequestDto._();

  factory SetMlModelLifecycleRequestDto([void updates(SetMlModelLifecycleRequestDtoBuilder b)]) = _$SetMlModelLifecycleRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SetMlModelLifecycleRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SetMlModelLifecycleRequestDto> get serializer => _$SetMlModelLifecycleRequestDtoSerializer();
}

class _$SetMlModelLifecycleRequestDtoSerializer implements PrimitiveSerializer<SetMlModelLifecycleRequestDto> {
  @override
  final Iterable<Type> types = const [SetMlModelLifecycleRequestDto, _$SetMlModelLifecycleRequestDto];

  @override
  final String wireName = r'SetMlModelLifecycleRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SetMlModelLifecycleRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'lifecycle';
    yield serializers.serialize(
      object.lifecycle,
      specifiedType: const FullType(SetMlModelLifecycleRequestDtoLifecycleEnum),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SetMlModelLifecycleRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SetMlModelLifecycleRequestDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'lifecycle':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(SetMlModelLifecycleRequestDtoLifecycleEnum),
          ) as SetMlModelLifecycleRequestDtoLifecycleEnum;
          result.lifecycle = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SetMlModelLifecycleRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SetMlModelLifecycleRequestDtoBuilder();
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

class SetMlModelLifecycleRequestDtoLifecycleEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'failed')
  static const SetMlModelLifecycleRequestDtoLifecycleEnum failed = _$setMlModelLifecycleRequestDtoLifecycleEnum_failed;
  @BuiltValueEnumConst(wireName: r'active')
  static const SetMlModelLifecycleRequestDtoLifecycleEnum active = _$setMlModelLifecycleRequestDtoLifecycleEnum_active;
  @BuiltValueEnumConst(wireName: r'registered')
  static const SetMlModelLifecycleRequestDtoLifecycleEnum registered = _$setMlModelLifecycleRequestDtoLifecycleEnum_registered;
  @BuiltValueEnumConst(wireName: r'canary')
  static const SetMlModelLifecycleRequestDtoLifecycleEnum canary = _$setMlModelLifecycleRequestDtoLifecycleEnum_canary;
  @BuiltValueEnumConst(wireName: r'archived')
  static const SetMlModelLifecycleRequestDtoLifecycleEnum archived = _$setMlModelLifecycleRequestDtoLifecycleEnum_archived;

  static Serializer<SetMlModelLifecycleRequestDtoLifecycleEnum> get serializer => _$setMlModelLifecycleRequestDtoLifecycleEnumSerializer;

  const SetMlModelLifecycleRequestDtoLifecycleEnum._(String name): super(name);

  static BuiltSet<SetMlModelLifecycleRequestDtoLifecycleEnum> get values => _$setMlModelLifecycleRequestDtoLifecycleEnumValues;
  static SetMlModelLifecycleRequestDtoLifecycleEnum valueOf(String name) => _$setMlModelLifecycleRequestDtoLifecycleEnumValueOf(name);
}

